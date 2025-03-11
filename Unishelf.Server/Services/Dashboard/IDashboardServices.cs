using Microsoft.AspNetCore.Mvc;

namespace Unishelf.Server.Services.Dashboard
{
    public interface IDashboardServices
    {
        Task<IActionResult> GetBrands();
        Task<IActionResult> GetCategories();
        Task<IActionResult> AddOrUpdateBrands(string? brandId, string brandName, bool isActive, string base64Image, string? brandImageId = null);
        Task<IActionResult> AddOrUpdateCatehories(string? categoryId, string categoryName, bool isActive);
        Task<IActionResult> UpdateCategoryEnabled(string categoryId, bool isEnabled); 
        Task<IActionResult> UpdateBrandEnabled(string brandId, bool isEnabled);

    }
}
