using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Xml;
using Unishelf.Server.Data;
using Newtonsoft.Json;

using Microsoft.EntityFrameworkCore;
using System.Xml.Linq;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System.Text.Json;
using Unishelf.Server.Models;
using static System.Net.Mime.MediaTypeNames;
using Unishelf.Server.Services.Products;

namespace Unishelf.Server.Controllers.StockManager
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockManagerController : Controller
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly EncryptionHelper _encryptionHelper;
        private readonly ProductsServices _productServices;

        public StockManagerController(EncryptionHelper encryptionHelper, ApplicationDbContext dbContext, ProductsServices productServices)
        {
            _encryptionHelper = encryptionHelper;
            _dbContext = dbContext;
            _productServices = productServices;
        }



        [HttpGet("categoriesBrands")]
        public async Task<IActionResult> GetCategoriesWithBrandsAndImages()
        {
            try
            {
                var categories = await _productServices.GetCategoriesWithBrandsAndImages();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching data.", Error = ex.Message });
            }
        }

       





        [HttpGet("products-by-brand-and-category")]
        public async Task<IActionResult> GetProductsByBrandAndCategory([FromQuery] string brandId, [FromQuery] string categoryId)
        {
            try
            {
                var productDetails = await _productServices.GetProductsByBrandAndCategory(brandId, categoryId);
                return Ok(productDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching products.", Error = ex.Message });
            }
        }

       

        [HttpGet("GetProductDetails/{productId}")]
        public async Task<IActionResult> GetProductDetails(string productId)
        {
            try
            {
                var products = await _productServices.GetProductDetails(productId);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching products.", Error = ex.Message });
            }
        }


      

        [HttpPost("AddImages")]
        public async Task<IActionResult> AddImage([FromBody] JsonElement request)
        {
            if (!request.TryGetProperty("ProductID", out JsonElement productIdElement) ||
                !request.TryGetProperty("Base64Image", out JsonElement base64ImageElement) ||
                string.IsNullOrEmpty(productIdElement.GetString()) ||
                string.IsNullOrEmpty(base64ImageElement.GetString()))
            {
                return BadRequest("ProductID and Base64Image are required.");
            }

            try
            {
                string encryptedProductId = productIdElement.GetString();
                string base64Image = base64ImageElement.GetString();

                Images image = await _productServices.AddImage(encryptedProductId, base64Image);
                return Ok(new { Message = "Image added successfully.", ImageID = image.ImageID });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }



        [HttpDelete("DeleteImage/{imageID}")]
        public async Task<IActionResult> DeleteImage(string imageID)
        {
            try
            {
               Images image = await _productServices.DeleteImage(imageID);
             
                return Ok(new { message = "Image deleted successfully." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }


        [HttpPost("AddorUpdateProduct")]
        public async Task<IActionResult> AddOrUpdateProduct([FromBody] JsonElement request)
        {
            try
            {
                // Call the service method
                var result = await _productServices.AddOrUpdateProduct(request);

                // Return the result from the service method
                if (result == "Product added/updated successfully.")
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }



        [HttpGet("GetActiveBrands")]
        public async Task<IActionResult> GetActiveBrands()
        {
            try
            {
                var brands = await _productServices.GetActiveBrands();
                return Ok(brands); // Returns HTTP 200 with the list of brands
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }

        [HttpGet("GetActiveCategories")]
        public async Task<IActionResult> GetActiveCategories()
        {
            try
            {
                var brands = await _productServices.GetActiveCatrgories();
                return Ok(brands); // Returns HTTP 200 with the list of brands
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }




    }
}