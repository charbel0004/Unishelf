using Microsoft.AspNetCore.Mvc;
using System;
using System.Text.Json;
using System.Threading.Tasks;
using Unishelf.Server.Services;

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

        [HttpPost("Add")]
        public async Task<IActionResult> AddToCart([FromBody] JsonElement body)
        {
            string encryptedUserId = body.GetProperty("encryptedUserId").GetString();
            string encryptedProductId = body.GetProperty("encryptedProductId").GetString();
            int quantity = body.GetProperty("quantity").GetInt32();

            if (string.IsNullOrEmpty(encryptedUserId))
                return BadRequest(new { errors = new { encryptedUserId = new[] { "The encryptedUserId field is required." } } });
            if (string.IsNullOrEmpty(encryptedProductId))
                return BadRequest(new { errors = new { encryptedProductId = new[] { "The encryptedProductId field is required." } } });
            if (quantity <= 0)
                return BadRequest(new { errors = new { quantity = new[] { "Quantity must be greater than zero." } } });

            try
            {
                var message = await _cartServices.AddToCartAsync(encryptedUserId, encryptedProductId, quantity);
                return Ok(new { message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateCartItem([FromBody] JsonElement body)
        {
            string encryptedUserId = body.GetProperty("encryptedUserId").GetString();
            string encryptedProductId = body.GetProperty("encryptedProductId").GetString();
            int quantity = body.GetProperty("quantity").GetInt32();

            if (string.IsNullOrEmpty(encryptedUserId))
                return BadRequest(new { errors = new { encryptedUserId = new[] { "The encryptedUserId field is required." } } });
            if (string.IsNullOrEmpty(encryptedProductId))
                return BadRequest(new { errors = new { encryptedProductId = new[] { "The encryptedProductId field is required." } } });
            if (quantity <= 0)
                return BadRequest(new { errors = new { quantity = new[] { "Quantity must be greater than zero." } } });

            try
            {
                var message = await _cartServices.UpdateCartItemAsync(encryptedUserId, encryptedProductId, quantity);
                return Ok(new { message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("Remove")]
        public async Task<IActionResult> RemoveFromCart([FromBody] JsonElement body)
        {
            string encryptedUserId = body.GetProperty("encryptedUserId").GetString();
            string encryptedProductId = body.GetProperty("encryptedProductId").GetString();

            if (string.IsNullOrEmpty(encryptedUserId))
                return BadRequest(new { errors = new { encryptedUserId = new[] { "The encryptedUserId field is required." } } });
            if (string.IsNullOrEmpty(encryptedProductId))
                return BadRequest(new { errors = new { encryptedProductId = new[] { "The encryptedProductId field is required." } } });

            try
            {
                var message = await _cartServices.RemoveFromCartAsync(encryptedUserId, encryptedProductId);
                return Ok(new { message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


          [HttpGet("user/{encryptedUserId}")]
        public async Task<ActionResult<List<Unishelf.Server.Models.Cart>>> GetCartItems(string encryptedUserId)
        {
            try
            {
                var cartItems = await _cartServices.GetCartItemsAsync(encryptedUserId);
                return Ok(cartItems);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to retrieve cart items.", error = ex.Message });
            }
        }

        [HttpPost("Clear")]
        public async Task<IActionResult> ClearCart([FromBody] JsonElement body)
        {
            if (!body.TryGetProperty("encryptedUserId", out var encryptedUserIdElement) ||
                string.IsNullOrEmpty(encryptedUserIdElement.GetString()))
            {
                return BadRequest(new { errors = new { encryptedUserId = new[] { "The encryptedUserId field is required." } } });
            }

            string encryptedUserId = encryptedUserIdElement.GetString();

            try
            {
                await _cartServices.ClearCartAsync(encryptedUserId);
                return Ok(new { message = "Cart cleared successfully." });
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                Console.WriteLine($"Error clearing cart: {ex}");
                return StatusCode(500, new { error = "An error occurred while clearing the cart.", details = ex.Message });
            }
        }


    }
}
