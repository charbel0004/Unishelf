using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Unishelf.Server.Data;
using Unishelf.Server.Models;
using ClosedXML.Excel;
using System.IO;
using Microsoft.AspNetCore.Http;

namespace Unishelf.Server.Services
{
    public class ReportsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly EncryptionHelper _encryptionHelper;

        public ReportsService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor, EncryptionHelper encryptionHelper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
            _encryptionHelper = encryptionHelper ?? throw new ArgumentNullException(nameof(encryptionHelper));
        }

        // DTOs for report data
        public class MonthlySalesDto
        {
            public string Month { get; set; }
            public decimal TotalSales { get; set; }
        }

        public class StockQuantityDto
        {
            public int ProductID { get; set; }
            public string ProductName { get; set; }
            public int Quantity { get; set; }
        }

        public class CartQuantityDto
        {
            public int ProductID { get; set; }
            public string ProductName { get; set; }
            public int TotalQuantity { get; set; }
        }

        private int? GetAuthenticatedUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("UserID")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return null;
            }
            try
            {
                var decryptedUserId = _encryptionHelper.Decrypt(userIdClaim);
                return int.TryParse(decryptedUserId, out int userId) ? userId : null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<MonthlySalesDto>> GetMonthlySalesAsync()
        {
            try
            {
                var endDate = DateTime.UtcNow;
                var startDate = endDate.AddMonths(-11);

                var sales = await _context.Orders
                    .Where(o => o.Status == "Delivered" && o.OrderDate >= startDate && o.OrderDate <= endDate)
                    .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        TotalSales = g.Sum(o => o.GrandTotal)
                    })
                    .OrderBy(g => g.Year)
                    .ThenBy(g => g.Month)
                    .ToListAsync();

                var salesDto = sales.Select(g => new MonthlySalesDto
                {
                    Month = $"{g.Year}-{g.Month:D2}",
                    TotalSales = g.TotalSales
                }).ToList();

                var result = new List<MonthlySalesDto>();
                for (var date = startDate; date <= endDate; date = date.AddMonths(1))
                {
                    var monthKey = $"{date.Year}-{date.Month:D2}";
                    var salesEntry = salesDto.FirstOrDefault(s => s.Month == monthKey) ?? new MonthlySalesDto
                    {
                        Month = monthKey,
                        TotalSales = 0m
                    };
                    result.Add(salesEntry);
                }

                return result;
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching monthly sales: " + ex.Message);
            }
        }

        public async Task<List<StockQuantityDto>> GetStockQuantitiesAsync()
        {
            try
            {
                return await _context.Products
                    .Select(p => new StockQuantityDto
                    {
                        ProductID = p.ProductID,
                        ProductName = p.ProductName,
                        Quantity = p.Quantity ?? 0
                    })
                    .OrderBy(p => p.ProductName)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching stock quantities: " + ex.Message);
            }
        }

        public async Task<List<CartQuantityDto>> GetCartQuantitiesAsync()
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (!userId.HasValue)
                {
                    throw new Exception("User ID not found or invalid in token.");
                }

                return await _context.Carts
                    .Where(c => c.UserID == userId.Value)
                    .GroupBy(c => new { c.ProductID, c.Products.ProductName })
                    .Select(g => new CartQuantityDto
                    {
                        ProductID = g.Key.ProductID,
                        ProductName = g.Key.ProductName,
                        TotalQuantity = g.Sum(c => c.Qty)
                    })
                    .OrderBy(c => c.ProductName)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching cart quantities: " + ex.Message);
            }
        }

        public async Task<byte[]> GenerateExcelReportAsync()
        {
            try
            {
                var monthlySales = await GetMonthlySalesAsync();
                var stockQuantities = await GetStockQuantitiesAsync();
                var cartQuantities = await GetCartQuantitiesAsync();

                using var workbook = new XLWorkbook();

                var salesSheet = workbook.Worksheets.Add("Monthly Sales");
                salesSheet.Cell(1, 1).Value = "Month";
                salesSheet.Cell(1, 2).Value = "Total Sales";
                for (int i = 0; i < monthlySales.Count; i++)
                {
                    salesSheet.Cell(i + 2, 1).Value = monthlySales[i].Month;
                    salesSheet.Cell(i + 2, 2).Value = monthlySales[i].TotalSales;
                }

                var stockSheet = workbook.Worksheets.Add("Stock Quantities");
                stockSheet.Cell(1, 1).Value = "Product ID";
                stockSheet.Cell(1, 2).Value = "Product Name";
                stockSheet.Cell(1, 3).Value = "Quantity in Stock";
                for (int i = 0; i < stockQuantities.Count; i++)
                {
                    stockSheet.Cell(i + 2, 1).Value = stockQuantities[i].ProductID;
                    stockSheet.Cell(i + 2, 2).Value = stockQuantities[i].ProductName;
                    stockSheet.Cell(i + 2, 3).Value = stockQuantities[i].Quantity;
                }

                var cartSheet = workbook.Worksheets.Add("Cart Quantities");
                cartSheet.Cell(1, 1).Value = "Product ID";
                cartSheet.Cell(1, 2).Value = "Product Name";
                cartSheet.Cell(1, 3).Value = "Quantity in Cart";
                for (int i = 0; i < cartQuantities.Count; i++)
                {
                    cartSheet.Cell(i + 2, 1).Value = cartQuantities[i].ProductID;
                    cartSheet.Cell(i + 2, 2).Value = cartQuantities[i].ProductName;
                    cartSheet.Cell(i + 2, 3).Value = cartQuantities[i].TotalQuantity;
                }

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                throw new Exception("Error generating Excel report: " + ex.Message);
            }
        }
    }
}