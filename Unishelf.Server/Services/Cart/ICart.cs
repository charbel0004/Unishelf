namespace Unishelf.Server.Services.Cart
{
    public interface ICart
    {
        Task AddToCart(string userId, string encryptedProductId, int quantity);
        Task UpdateCartItem(string userId, string encryptedProductId, int quantity);
        Task RemoveFromCart(string userId, string encryptedProductId);
        Task ClearCart(string userId);
        Task<List<object>> GetCartItems(string userId);
    }
}
