using Microsoft.AspNetCore.Mvc;

namespace Unishelf.Server.Services.Dashboard
{
    public interface IDashboardServices
    {
        Task<IActionResult> GetBrands();
        Task<IActionResult> GetCategories();
        Task<IActionResult> AddOrUpdateBrands();
        Task<IActionResult> AddOrUpdateCatehories();

    }
}
