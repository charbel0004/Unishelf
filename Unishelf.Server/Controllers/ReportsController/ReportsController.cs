using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Unishelf.Server.Services;
using Microsoft.Extensions.Logging;

namespace Unishelf.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly ReportsService _reportsService;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(ReportsService reportsService, ILogger<ReportsController> logger)
        {
            _reportsService = reportsService;
            _logger = logger;
        }

        [HttpGet("MonthlySales")]
        public async Task<IActionResult> GetMonthlySales()
        {
            try
            {
                var sales = await _reportsService.GetMonthlySalesAsync();
                return Ok(sales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetMonthlySales");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("StockQuantities")]
        public async Task<IActionResult> GetStockQuantities()
        {
            try
            {
                var stock = await _reportsService.GetStockQuantitiesAsync();
                return Ok(stock);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetStockQuantities");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("CartQuantities")]
        public async Task<IActionResult> GetCartQuantities()
        {
            try
            {
                var cart = await _reportsService.GetCartQuantitiesAsync();
                return Ok(cart);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetCartQuantities");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("DownloadExcel")]
        public async Task<IActionResult> DownloadExcel()
        {
            try
            {
                var fileBytes = await _reportsService.GenerateExcelReportAsync();
                var fileName = $"SalesReport_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DownloadExcel");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}