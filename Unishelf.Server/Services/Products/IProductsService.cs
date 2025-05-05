using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Unishelf.Server.Models;

namespace Unishelf.Server.Services.Products
{
    public interface IProductsService
    {
        Task<List<object>> GetCategoriesWithBrandsAndImages();
        Task<List<object>> GetProductsByBrandAndCategory(string brandId, string categoryId);
        Task<object> GetProductDetails(string productId);
        Task<string> AddImage(string encryptedProductId, string base64Image); // <-- Changed to return string
        Task<Images> DeleteImage(string imageID);
        Task<string> AddOrUpdateProduct(JsonElement request);
        Task<List<object>> GetActiveBrands();
        Task<List<object>> GetActiveCatrgories();
    }
}
