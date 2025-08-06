using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Unishelf.Server.Services;
using Unishelf.Server.Data;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly EncryptionHelper _encryptionHelper;
    private readonly OrdersService _ordersService;

    public OrdersController(ApplicationDbContext context, EncryptionHelper encryptionHelper, OrdersService ordersService)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _encryptionHelper = encryptionHelper ?? throw new ArgumentNullException(nameof(encryptionHelper));
        _ordersService = ordersService ?? throw new ArgumentNullException(nameof(ordersService));
    }

    [HttpPost("Create")]
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromBody] OrderService.OrderRequestDto orderDto)
    {
        if (orderDto == null)
            return BadRequest(new { error = "Order data is required." });

        // Manual instantiation of OrderService
        var orderService = new OrderService(_context, _encryptionHelper);
        try
        {
            var orderId = await orderService.CreateOrderAsync(orderDto);
            return Ok(new { orderID = orderId });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("CreateGuest")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateGuestOrder([FromBody] OrderService.OrderRequestDto orderDto)
    {
        if (orderDto == null)
            return BadRequest(new { error = "Order data is required." });

        // Manual instantiation of OrderService
        var orderService = new OrderService(_context, _encryptionHelper);
        try
        {
            var orderId = await orderService.CreateGuestOrderAsync(orderDto);
            return Ok(new { orderID = orderId });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("GetAllOrders")]
    public async Task<IActionResult> GetAllOrders()
    {
        try
        {
            var orders = await _ordersService.GetAllOrdersAsync();
            return Ok(orders ?? new List<OrdersService.OrderResponseDto>());
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("user/{encryptedUserId}")]
    public async Task<IActionResult> GetOrdersByUser(string encryptedUserId)
    {
        try
        {
            var orders = await _ordersService.GetOrdersByUserAsync(encryptedUserId);
            return Ok(orders);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Error fetching orders: {ex.Message}" });
        }
    }

    [Authorize]
    [HttpPut("UpdateStatus")]
    public async Task<IActionResult> UpdateOrderStatus([FromBody] OrdersService.UpdateOrderStatusDto updateDto)
    {
        // Manual instantiation to keep your approach
        var orderService = new OrdersService(_context, _encryptionHelper);
        try
        {
            var success = await orderService.UpdateOrderStatusAsync(updateDto);
            if (!success)
            {
                return BadRequest(new { error = "Failed to update order status." });
            }
            return Ok(new { message = "Order status updated successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}