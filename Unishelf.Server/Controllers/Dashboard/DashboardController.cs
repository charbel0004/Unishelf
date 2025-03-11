using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Unishelf.Server.Data;
using Unishelf.Server.Models;
using Unishelf.Server.Services.Dashboard;
using Unishelf.Server.Services.Products;

namespace Unishelf.Server.Controllers.Dashboard
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : Controller
    {
        private readonly DashboardServices _dashboardServices;
        private readonly ApplicationDbContext _dbContext;
        private readonly EncryptionHelper _encryptionHelper;

        public DashboardController(EncryptionHelper encryptionHelper, ApplicationDbContext dbContext,  DashboardServices dashboardServices)
        {
            _encryptionHelper = encryptionHelper;
            _dbContext = dbContext;
            _dashboardServices = dashboardServices;
        }

        [HttpGet("GetBrands")]
        public async Task<ActionResult<List<Brands>>> GetAllBrands()
        {
            var brands = await _dashboardServices.GetBrands();
            return Ok(brands);
        } 
        
        [HttpGet("GetCategories")]
        public async Task<ActionResult<List<Categories>>> GCategories()
        {
            var brands = await _dashboardServices.GetCategories();
            return Ok(brands);
        }

        [HttpPost("AddOrUpdateBrand")]
        public async Task<IActionResult> AddOrUpdateBrand([FromBody] JsonElement request)
        {
            try
            {
                string brandID = request.TryGetProperty("brandId", out var brandIdProp) ? brandIdProp.GetString() : null;
                string brandName = request.TryGetProperty("brandName", out var brandNameProp) ? brandNameProp.GetString() : null;
                bool isActive = request.TryGetProperty("isActive", out var isActiveProp) ? isActiveProp.GetBoolean() : true; // Default to true if not provided
                string base64Image = request.TryGetProperty("base64Image", out var base64ImageProp) ? base64ImageProp.GetString() : null;
                string brandImagesID = request.TryGetProperty("brandImageId", out var brandImagesIDProp) ? brandImagesIDProp.GetString() : null;

                if (string.IsNullOrWhiteSpace(brandName))
                    return BadRequest("Brand name is required.");

                int brandId = await _dashboardServices.AddOrUpdateBrand(brandID, brandName, isActive, base64Image, brandImagesID);

                return Ok("Brand added successfully");
            }
            catch (FormatException)
            {
                return BadRequest("Invalid Base64 image format.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }



        [HttpPost("AddOrUpdateCategory")]
        public async Task<IActionResult> AddOrUpdateCategory([FromBody] JsonElement request)
        {
            try
            {


                string categoryName = request.TryGetProperty("categoryName", out JsonElement categoryNameElement)
            ? categoryNameElement.GetString()
            : null;

                // Extract 'CategoryId' (nullable) and 'IsActive'
                string ? categoryId = request.TryGetProperty("categoryId", out JsonElement categoryIdElement)
                    ? categoryIdElement.GetString()
                    : null;

                bool isActive = request.TryGetProperty("isActive", out JsonElement isActiveElement)
                                && isActiveElement.GetBoolean();

                // Call the AddOrUpdateCategory service method
                int categoryIdResult = await _dashboardServices.AddOrUpdateCategory(categoryId, categoryName, isActive);

                // Return a success message with the category ID
                return Ok(new { Message = "Category added/updated successfully.", CategoryId = categoryIdResult });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Category not found.");
            }
            catch (FormatException)
            {
                return BadRequest("Invalid category ID format.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while processing your request: {ex.Message}");
            }
        }


        [HttpPut("update-category-status")]
        public async Task<IActionResult> UpdateCategoryStatus([FromBody] JsonElement request)
        {
            if (!request.TryGetProperty("CategoryId", out JsonElement categoryIdElement) ||
                !request.TryGetProperty("IsEnabled", out JsonElement isEnabledElement))
            {
                return BadRequest("Invalid request payload.");
            }

            string categoryId = categoryIdElement.GetString();
            bool isEnabled = isEnabledElement.GetBoolean();

            if (string.IsNullOrEmpty(categoryId))
            {
                return BadRequest("Category ID is required.");
            }

            var result = await _dashboardServices.UpdateCategoryEnabled(categoryId, isEnabled);

            if (!result)
            {
                return NotFound("Category not found.");
            }

            return Ok(new { message = "Category status updated successfully." });
        }
        
        
        
        [HttpPut("update-brand-status")]
        public async Task<IActionResult> UpdateBrandStatus([FromBody] JsonElement request)
        {
            if (!request.TryGetProperty("BrandId", out JsonElement brandIdElement) ||
                !request.TryGetProperty("IsEnabled", out JsonElement isEnabledElement))
            {
                return BadRequest("Invalid request payload.");
            }

            string brandId = brandIdElement.GetString();
            bool isEnabled = isEnabledElement.GetBoolean();

            if (string.IsNullOrEmpty(brandId))
            {
                return BadRequest("Brand ID is required.");
            }

            var result = await _dashboardServices.UpdateBrandEnabled(brandId, isEnabled);

            if (!result)
            {
                return NotFound("Brand not found.");
            }

            return Ok(new { message = "Brand status updated successfully." });
        }




    }
}
