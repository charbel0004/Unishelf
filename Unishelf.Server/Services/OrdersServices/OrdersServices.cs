using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unishelf.Server.Data;
using Unishelf.Server.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Unishelf.Server.Services
{
    public class OrdersService
    {
        private readonly ApplicationDbContext _context;
        private readonly EncryptionHelper _encryptionHelper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OrdersService(ApplicationDbContext context, EncryptionHelper encryptionHelper, IHttpContextAccessor httpContextAccessor)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _encryptionHelper = encryptionHelper ?? throw new ArgumentNullException(nameof(encryptionHelper));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        }

        [Obsolete("This constructor is deprecated. Use the constructor with IHttpContextAccessor instead.")]
        public OrdersService(ApplicationDbContext context, EncryptionHelper encryptionHelper)
        {
            _context = context;
            _encryptionHelper = encryptionHelper;
        }

        // DTOs remain unchanged
        public class OrderResponseDto
        {
            public string OrderID { get; set; }
            public int nOrderID { get; set; }
            public string UserID { get; set; }
            public string UserName { get; set; }
            public DateTime OrderDate { get; set; }
            public decimal Subtotal { get; set; }
            public decimal DeliveryCharge { get; set; }
            public decimal GrandTotal { get; set; }
            public string Status { get; set; }
            public DateTime CreatedDate { get; set; }
            public DateTime? UpdatedDate { get; set; }
            public string UpdatedByUserName { get; set; }
            public List<OrderItemResponseDto> OrderItems { get; set; }
            public DeliveryAddressesResponseDto DeliveryAddresses { get; set; }
        }

        public class OrderItemResponseDto
        {
            public int OrderItemID { get; set; }
            public string ProductID { get; set; }
            public string ProductName { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalPrice { get; set; }
        }

        public class DeliveryAddressesResponseDto
        {
            public int DeliveryAddressID { get; set; }
            public string Street { get; set; }
            public string City { get; set; }
            public string PostalCode { get; set; }
            public string Country { get; set; }
            public string StateProvince { get; set; }
            public string PhoneNumber { get; set; }
        }

        public class UpdateOrderStatusDto
        {
            public string OrderID { get; set; }
            public string Status { get; set; }
            public string UpdatedBy { get; set; }
        }

        private string EncryptId(int id)
        {
            return _encryptionHelper.Encrypt(id.ToString());
        }

        private int? DecryptId(string encryptedId)
        {
            if (string.IsNullOrEmpty(encryptedId))
            {
                return null;
            }
            try
            {
                var decryptedId = _encryptionHelper.Decrypt(encryptedId);
                if (int.TryParse(decryptedId, out int id))
                {
                    return id;
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<OrderResponseDto>> GetAllOrdersAsync()
        {
            var userClaims = _httpContextAccessor?.HttpContext?.User;
            if (userClaims == null)
            {
                throw new UnauthorizedAccessException("User is not authenticated.");
            }

            var userIdClaim = userClaims.FindFirst("UserID")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new UnauthorizedAccessException("UserID claim is missing.");
            }

            // Decrypt the UserID claim
            int? currentUserId = DecryptId(userIdClaim);
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Invalid UserID in claims: Decryption failed or invalid format.");
            }

            bool isEmployee = userClaims.FindFirst("Role_Employee")?.Value == "True";
            bool isManager = userClaims.FindFirst("Role_Manager")?.Value == "True";

            Console.WriteLine($"GetAllOrdersAsync: EncryptedUserID={userIdClaim}, DecryptedUserID={currentUserId}, IsEmployee={isEmployee}, IsManager={isManager}");

            var query = _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Products)
                .Include(o => o.DeliveryAddresses)
                .Include(o => o.User)
                .AsQueryable();

            if (isManager)
            {
                // Managers see all orders
            }
            else if (isEmployee)
            {
                query = query.Where(o => o.UpdatedBy == currentUserId && o.Status != "Pending");
            }
            else
            {
                throw new UnauthorizedAccessException("User does not have permission to view orders.");
            }

            var orders = await query.ToListAsync();

            var users = await _context.User.ToListAsync();
            var userDictionary = users.ToDictionary(u => u.UserID, u => u.UserName ?? "Unknown");

            return orders.Select(order => new OrderResponseDto
            {
                OrderID = EncryptId(order.OrderID),
                nOrderID = order.OrderID,
                UserID = order.UserID.HasValue ? EncryptId(order.UserID.Value) : null,
                UserName = order.User?.UserName ?? "Guest",
                OrderDate = order.OrderDate,
                Subtotal = order.Subtotal,
                DeliveryCharge = order.DeliveryCharge,
                GrandTotal = order.GrandTotal,
                Status = order.Status,
                CreatedDate = order.CreatedDate,
                UpdatedDate = order.UpdatedDate,
                UpdatedByUserName = order.UpdatedBy.HasValue && userDictionary.ContainsKey(order.UpdatedBy.Value) ? userDictionary[order.UpdatedBy.Value] : "Unknown",
                OrderItems = order.OrderItems?.Select(oi => new OrderItemResponseDto
                {
                    OrderItemID = oi.OrderItemID,
                    ProductID = EncryptId(oi.ProductID),
                    ProductName = oi.Products?.ProductName ?? "Unknown Product",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice
                }).ToList() ?? new List<OrderItemResponseDto>(),
                DeliveryAddresses = order.DeliveryAddresses != null ? new DeliveryAddressesResponseDto
                {
                    DeliveryAddressID = order.DeliveryAddresses.DeliveryAddressID,
                    Street = order.DeliveryAddresses.Street,
                    City = order.DeliveryAddresses.City,
                    PostalCode = order.DeliveryAddresses.PostalCode,
                    Country = order.DeliveryAddresses.Country,
                    StateProvince = order.DeliveryAddresses.StateProvince,
                    PhoneNumber = order.DeliveryAddresses.PhoneNumber
                } : null
            }).ToList();
        }

        public async Task<bool> UpdateOrderStatusAsync(UpdateOrderStatusDto updateDto)
        {
            int? updatedByUserId = null; // Declare single variable at method scope

            // Handle deprecated constructor
            var userClaims = _httpContextAccessor?.HttpContext?.User;
            if (userClaims == null)
            {
                Console.WriteLine("UpdateOrderStatusAsync: Using deprecated constructor, skipping role check.");
                if (!string.IsNullOrEmpty(updateDto?.UpdatedBy))
                {
                    updatedByUserId = DecryptId(updateDto.UpdatedBy);
                    if (!updatedByUserId.HasValue)
                    {
                        throw new ArgumentException("Invalid UpdatedBy UserID: Decryption failed or invalid format.");
                    }
                    var userExists = await _context.User.AnyAsync(u => u.UserID == updatedByUserId.Value);
                    if (!userExists)
                    {
                        throw new ArgumentException("Invalid UpdatedBy UserID: User does not exist.");
                    }
                }
            }
            else
            {
                // Normal case: Check roles
                bool isEmployee = userClaims.FindFirst("Role_Employee")?.Value == "True";
                bool isManager = userClaims.FindFirst("Role_Manager")?.Value == "True";
                if (!isEmployee && !isManager)
                {
                    throw new UnauthorizedAccessException("User does not have permission to update orders.");
                }

                // Validate UpdatedBy matches JWT UserID (both encrypted)
                var userIdClaim = userClaims.FindFirst("UserID")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    throw new UnauthorizedAccessException("UserID claim is missing.");
                }
                if (updateDto?.UpdatedBy != userIdClaim)
                {
                    throw new UnauthorizedAccessException("UpdatedBy does not match authenticated user.");
                }
            }

            if (updateDto == null || string.IsNullOrEmpty(updateDto.OrderID) || string.IsNullOrEmpty(updateDto.Status) || string.IsNullOrEmpty(updateDto.UpdatedBy))
            {
                return false;
            }

            // Decrypt OrderID
            int? decryptedOrderId = DecryptId(updateDto.OrderID);
            if (!decryptedOrderId.HasValue)
            {
                throw new ArgumentException("Invalid OrderID");
            }

            // Decrypt UpdatedBy (if not already set in deprecated case)
            if (updatedByUserId == null)
            {
                updatedByUserId = DecryptId(updateDto.UpdatedBy);
                if (!updatedByUserId.HasValue)
                {
                    throw new ArgumentException("Invalid UpdatedBy UserID: Decryption failed or invalid format.");
                }
            }

            // Begin transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Fetch order with its OrderItems
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.OrderID == decryptedOrderId.Value);
                if (order == null)
                {
                    return false;
                }

                // If status is "Cancelled," restore quantities to Products
                if (updateDto.Status == "Cancelled" && order.OrderItems != null && order.OrderItems.Any())
                {
                    foreach (var orderItem in order.OrderItems)
                    {
                        var product = await _context.Products.FindAsync(orderItem.ProductID);
                        if (product == null)
                        {
                            throw new ArgumentException($"Product not found for ProductID: {orderItem.ProductID}");
                        }

                        // Restore quantity
                        product.Quantity = (product.Quantity ?? 0) + orderItem.Quantity;
                        // Set Available to true if stock is now positive
                        if (product.Quantity > 0)
                        {
                            product.Available = true;
                        }

                        _context.Products.Update(product);
                    }
                }

                // Update order details
                order.Status = updateDto.Status;
                order.UpdatedDate = DateTime.UtcNow;
                order.UpdatedBy = updatedByUserId.Value; // Store unencrypted

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Failed to update order status: {ex.Message}", ex);
            }
        }

        public async Task<List<object>> GetOrdersByUserAsync(string encryptedUserId)
        {
            if (string.IsNullOrEmpty(encryptedUserId))
            {
                throw new ArgumentException("User ID is required.", nameof(encryptedUserId));
            }

            string decryptedUserId = _encryptionHelper.Decrypt(encryptedUserId);
            if (!int.TryParse(decryptedUserId, out int userId))
            {
                throw new ArgumentException("Invalid User ID format.", nameof(encryptedUserId));
            }

            var orders = await _context.Orders
                .Where(o => o.UserID == userId)
                .Select(o => new
                {
                    orderID = _encryptionHelper.Encrypt(o.OrderID.ToString()),
                    nOrderID = o.OrderID,
                    userID = o.UserID != null ? _encryptionHelper.Encrypt(o.UserID.ToString()) : null,
                    userName = o.User != null ? o.User.UserName : "Guest",
                    orderDate = o.OrderDate.ToString("yyyy-MM-dd"),
                    subtotal = o.Subtotal,
                    deliveryCharge = o.DeliveryCharge,
                    grandTotal = o.GrandTotal,
                    status = o.Status,
                    createdDate = o.CreatedDate.ToString("yyyy-MM-dd"),
                    orderItems = o.OrderItems.Select(oi => new
                    {
                        orderItemID = oi.OrderItemID,
                        productID = _encryptionHelper.Encrypt(oi.ProductID.ToString()),
                        productName = oi.Products.ProductName,
                        quantity = oi.Quantity,
                        unitPrice = (double)oi.UnitPrice,
                        totalPrice = (double)oi.TotalPrice
                    }).ToList(),
                    deliveryAddresses = new
                    {
                        deliveryAddressID = o.DeliveryAddresses.DeliveryAddressID,
                        street = o.DeliveryAddresses.Street,
                        city = o.DeliveryAddresses.City,
                        postalCode = o.DeliveryAddresses.PostalCode,
                        country = o.DeliveryAddresses.Country,
                        stateProvince = o.DeliveryAddresses.StateProvince,
                        phoneNumber = o.DeliveryAddresses.PhoneNumber
                    }
                })
                .ToListAsync();

            return orders.Cast<object>().ToList();
        }



    }
}
       
