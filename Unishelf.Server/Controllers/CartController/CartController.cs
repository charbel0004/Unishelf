using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Unishelf.Server.Services;
using System;

namespace Unishelf.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly CartServices _cartServices;

        public CartController(CartServices cartServices)
        {
            _cartServices = cartServices;
        }

        [HttpPost("Add-Cart-Items")]
        public async Task<IActionResult> AddToCart(string userId, string encryptedProductId, int quantity)
        {
            try
            {
                await _cartServices.AddToCart(userId, encryptedProductId, quantity);
                return Ok(new { message = "Item added to cart." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("Update-Cart-Items")]
        public async Task<IActionResult> UpdateCartItem(string userId, string encryptedProductId, int quantity)
        {
            try
            {
                await _cartServices.UpdateCartItem(userId, encryptedProductId, quantity);
                return Ok(new { message = "Cart item updated." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("Remove-Cart-Items")]
        public async Task<IActionResult> RemoveFromCart(string userId, string encryptedProductId)
        {
            try
            {
                await _cartServices.RemoveFromCart(userId, encryptedProductId);
                return Ok(new { message = "Item removed from cart." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("Clear-Cart-Items")]
        public async Task<IActionResult> ClearCart(string userId)
        {
            try
            {
                await _cartServices.ClearCart(userId);
                return Ok(new { message = "Cart cleared." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("Get-Cart-Items")]
        public async Task<IActionResult> GetCartItems(string userId)
        {
            try
            {
                var items = await _cartServices.GetCartItems(userId);
                return Ok(items);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
