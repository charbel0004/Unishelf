using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Unishelf.Server.Data;
using Unishelf.Server.Models;

namespace Unishelf.Server.Services
{
    public class CartServices
    {
        private readonly ApplicationDbContext _dbcontext;
        private readonly EncryptionHelper _encryptionHelper;

        public CartServices(ApplicationDbContext dbcontext, EncryptionHelper encryptionHelper)
        {
            _dbcontext = dbcontext;
            _encryptionHelper = encryptionHelper;
        }

        // Add product to Cart
        public async Task<string> AddToCartAsync(string encryptedUserId, string encryptedProductId, int qty)
        {
            int userId = int.Parse(_encryptionHelper.Decrypt(encryptedUserId));
            int productId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

            var product = await _dbcontext.Products.FindAsync(productId);
            if (product == null || !product.Available)
                return "Product not found or unavailable.";

            var existingCartItem = await _dbcontext.Carts
                .FirstOrDefaultAsync(c => c.UserID == userId && c.ProductID == productId);

            decimal unitPrice = (decimal)(product.Price ?? 0.0);

            if (existingCartItem != null)
            {
                existingCartItem.Qty += qty;
                existingCartItem.TotalPrice = existingCartItem.Qty * unitPrice;
                existingCartItem.UpdatedDate = DateTime.UtcNow;
            }
            else
            {
                var newCart = new Unishelf.Server.Models.Cart
                {
                    UserID = userId,
                    ProductID = productId,
                    Qty = qty,
                    UnitPrice = unitPrice,
                    TotalPrice = qty * unitPrice,
                    AddedDate = DateTime.UtcNow
                };
                _dbcontext.Carts.Add(newCart);
            }

            await _dbcontext.SaveChangesAsync();
            return "Item added to cart.";
        }

        // Update quantity in cart
        public async Task<string> UpdateCartItemAsync(string encryptedUserId, string encryptedProductId, int newQty)
        {
            int userId = int.Parse(_encryptionHelper.Decrypt(encryptedUserId));
            int productId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

            var cartItem = await _dbcontext.Carts
                .FirstOrDefaultAsync(c => c.UserID == userId && c.ProductID == productId);

            if (cartItem == null)
                return "Cart item not found.";

            cartItem.Qty = newQty;
            cartItem.TotalPrice = newQty * cartItem.UnitPrice;
            cartItem.UpdatedDate = DateTime.UtcNow;

            await _dbcontext.SaveChangesAsync();
            return "Cart item updated.";
        }

        // Remove item from cart
        public async Task<string> RemoveFromCartAsync(string encryptedUserId, string encryptedProductId)
        {
            int userId = int.Parse(_encryptionHelper.Decrypt(encryptedUserId));
            int productId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

            var cartItem = await _dbcontext.Carts
                .FirstOrDefaultAsync(c => c.UserID == userId && c.ProductID == productId);

            if (cartItem == null)
                return "Cart item not found.";

            _dbcontext.Carts.Remove(cartItem);
            await _dbcontext.SaveChangesAsync();
            return "Item removed from cart.";
        }


        public async Task<List<CartProduct>> GetCartItemsAsync(string encryptedUserId)
        {
            try
            {
                int userId = int.Parse(_encryptionHelper.Decrypt(encryptedUserId));

                var cartItems = await _dbcontext.Carts
                    .Include(c => c.Products)
                        .ThenInclude(p => p.Images) // Include Images navigation property
                    .Where(c => c.UserID == userId)
                    .Select(c => new CartProduct
                    {
                        id = _encryptionHelper.Encrypt(c.ProductID.ToString()),
                        name = c.Products.ProductName,
                        price = c.UnitPrice,
                        quantity = c.Qty,
                        currency = c.Products.Currency,
                        image = c.Products.Images != null && c.Products.Images.Any()
                            ? Convert.ToBase64String(c.Products.Images.First().Image)
                            : null // Convert first image to base64, or null if no images
                    })
                    .ToListAsync();

                return cartItems;
            }
            catch (Exception ex)
            {
                // Optionally log ex here
                throw new ApplicationException("Failed to retrieve cart items", ex);
            }
        }

        public async Task ClearCartAsync(string encryptedUserId)
        {
            int userId = int.Parse(_encryptionHelper.Decrypt(encryptedUserId));
            var cartItems = _dbcontext.Carts.Where(c => c.UserID == userId);
            _dbcontext.Carts.RemoveRange(cartItems);
            await _dbcontext.SaveChangesAsync();
        }


    }

    // Define a Data Transfer Object (DTO) -  Define it outside the service method
    public class CartProduct
    {
        public string id { get; set; }
        public string name { get; set; }
        public decimal price { get; set; } // Use decimal for price
        public int quantity { get; set; }

        public string image { get; set; }
        public string currency { get; set; }
    }

}

