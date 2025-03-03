using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Unishelf.Server.Services.Products
{
    public interface IProductsService
    {
        Task<IActionResult> GetCategoriesWithBrandsAndImages();
        Task<IActionResult> GetProductsByBrandAndCategory(string brandId, string categoryId);
        Task<IActionResult> GetProductDetails(string productId);
        Task<IActionResult> AddImage([FromBody] JsonElement request);
        Task<IActionResult> DeleteImage(string imageID);
        Task<IActionResult> AddOrUpdateProduct([FromBody] JsonElement request);
        Task<IActionResult> GetActiveBrands();
        Task<IActionResult> GetActiveCategories();
    }
}
