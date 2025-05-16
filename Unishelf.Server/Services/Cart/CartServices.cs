using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unishelf.Server.Data;
using Unishelf.Server.Models;
using Unishelf.Server.Services.Cart;

namespace Unishelf.Server.Services
{


    public class CartServices : ICart
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly EncryptionHelper _encryptionHelper;

        public CartServices(ApplicationDbContext dbContext, EncryptionHelper encryptionHelper)
        {
            _dbContext = dbContext;
            _encryptionHelper = encryptionHelper;
        }

      
  public async Task AddToCart(string userId, string encryptedProductId, int quantity)
        {
            try
            {
                if (quantity <= 0)
                {
                    throw new ArgumentException("Quantity must be at least 1.");
                }

                // Find user by username or email
                var user = await _dbContext.User
                    .FirstOrDefaultAsync(u => u.UserName == userId || u.EmailAddress == userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found.");
                }

                // Decrypt product ID
                int productId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

                // Verify product exists
                var product = await _dbContext.Products
                    .FirstOrDefaultAsync(p => p.ProductID == productId);
                if (product == null)
                {
                    throw new ArgumentException("Product not found.");
                }

                // Check stock availability
                if (product.Quantity.HasValue && product.Quantity.Value < quantity)
                {
                    throw new ArgumentException($"Requested quantity ({quantity}) exceeds available stock ({product.Quantity.Value}).");
                }

                // Calculate unit price (price per box)
                decimal unitPrice = product.PricePerMsq.HasValue && product.SqmPerBox.HasValue
                    ? (decimal)(product.PricePerMsq.Value * product.SqmPerBox.Value)
                    : product.Price.HasValue
                    ? (decimal)product.Price.Value
                    : 0m;

                if (unitPrice == 0m)
                {
                    throw new ArgumentException("Product price information is missing.");
                }

                // Check if item already exists in cart
                var cartItem = await _dbContext.Carts
                    .FirstOrDefaultAsync(c => c.UserID == user.UserID && c.ProductID == productId);

                if (cartItem != null)
                {
                    // Check stock for updated quantity
                    if (product.Quantity.HasValue && product.Quantity.Value < cartItem.Qty + quantity)
                    {
                        throw new ArgumentException($"Requested quantity ({cartItem.Qty + quantity}) exceeds available stock ({product.Quantity.Value}).");
                    }

                    // Update quantity and total price
                    cartItem.Qty += quantity;
                    cartItem.UnitPrice = unitPrice; // Update price in case it changed
                    cartItem.TotalPrice = cartItem.UnitPrice * cartItem.Qty;
                    cartItem.UpdatedDate = DateTime.UtcNow;
                }
                else
                {
                    // Add new cart item
                    cartItem = new Unishelf.Server.Models.Cart
                    {
                        UserID = user.UserID,
                        ProductID = productId,
                        Qty = quantity,
                        UnitPrice = unitPrice,
                        TotalPrice = unitPrice * quantity,
                        AddedDate = DateTime.UtcNow,
                        UpdatedDate = null
                    };
                    _dbContext.Carts.Add(cartItem);
                }

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error adding to cart: {ex.Message}");
            }
        }





        public async Task UpdateCartItem(string userId, string encryptedProductId, int quantity)
        {
            try
            {
                if (quantity <= 0)
                {
                    throw new ArgumentException("Quantity must be at least 1.");
                }

                // Find user by username or email
                var user = await _dbContext.User
                    .FirstOrDefaultAsync(u => u.UserName == userId || u.EmailAddress == userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found.");
                }

                // Decrypt product ID
                int productId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

                // Find cart item
                var cartItem = await _dbContext.Carts
                    .FirstOrDefaultAsync(c => c.UserID == user.UserID && c.ProductID == productId);
                if (cartItem == null)
                {
                    throw new ArgumentException("Cart item not found.");
                }

                // Update product price in case it changed
                var product = await _dbContext.Products
                    .FirstOrDefaultAsync(p => p.ProductID == productId);
                if (product == null)
                {
                    throw new ArgumentException("Product not found.");
                }

                decimal unitPrice = product.PricePerMsq.HasValue && product.SqmPerBox.HasValue
                    ? (decimal)(product.PricePerMsq.Value * product.SqmPerBox.Value)
                    : product.Price.HasValue
                    ? (decimal)product.Price.Value
                    : 0m;

                if (unitPrice == 0m)
                {
                    throw new ArgumentException("Product price information is missing.");
                }

                cartItem.Qty = quantity;
                cartItem.UnitPrice = unitPrice;
                cartItem.TotalPrice = cartItem.UnitPrice * cartItem.Qty;
                cartItem.UpdatedDate = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error updating cart item: {ex.Message}");
            }
        }

        public async Task RemoveFromCart(string userId, string encryptedProductId)
        {
            try
            {
                // Find user by username or email
                var user = await _dbContext.User
                    .FirstOrDefaultAsync(u => u.UserName == userId || u.EmailAddress == userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found.");
                }

                // Decrypt product ID
                int productId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

                // Find cart item
                var cartItem = await _dbContext.Carts
                    .FirstOrDefaultAsync(c => c.UserID == user.UserID && c.ProductID == productId);
                if (cartItem == null)
                {
                    return; // Item not in cart, no action needed
                }

                _dbContext.Carts.Remove(cartItem);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error removing from cart: {ex.Message}");
            }
        }

        public async Task ClearCart(string userId)
        {
            try
            {
                // Find user by username or email
                var user = await _dbContext.User
                    .FirstOrDefaultAsync(u => u.UserName == userId || u.EmailAddress == userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found.");
                }

                // Remove all cart items for users
                var cartItems = await _dbContext.Carts
                    .Where(c => c.UserID == user.UserID)
                    .ToListAsync();
                _dbContext.Carts.RemoveRange(cartItems);

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error clearing cart: {ex.Message}");
            }
        }

        public async Task<List<object>> GetCartItems(string userId)
        {
            try
            {
                // Find user by username or email
                var user = await _dbContext.User
                    .FirstOrDefaultAsync(u => u.UserName == userId || u.EmailAddress == userId);
                if (user == null)
                {
                    return new List<object>(); // Return empty list if user not found
                }

                var cartItems = await _dbContext.Carts
                    .Where(c => c.UserID == user.UserID)
                    .Include(c => c.Products)
                    .Select(c => new
                    {
                        id = _encryptionHelper.Encrypt(c.ProductID.ToString()),
                        name = c.Products.ProductName,
                        price = (double)c.UnitPrice,
                        quantity = c.Qty
                    })
                    .ToListAsync();

                return cartItems.Cast<object>().ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving cart items: {ex.Message}");
            }
        }
    }
}