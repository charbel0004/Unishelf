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

namespace Unishelf.Server.Controllers.StockManager
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockManagerController : Controller
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly EncryptionHelper _encryptionHelper;

        public StockManagerController(EncryptionHelper encryptionHelper, ApplicationDbContext dbContext)
        {
            _encryptionHelper = encryptionHelper;
            _dbContext = dbContext;
        }

        [HttpGet("categoriesBrands")]
        public IActionResult GetCategoriesWithBrandsAndImages()
        {
            try
            {
                using (var connection = new SqlConnection(_dbContext.Database.GetConnectionString()))
                {
                    connection.Open();

                    using (SqlCommand command = new SqlCommand("[dbo].[UN_GetCategoriesWithBrandsAndImages]", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            var categories = new List<object>();
                            var categorySet = new HashSet<string>(); // To track unique categories

                            while (reader.Read())
                            {
                                var encryptedCategoryID = _encryptionHelper.Encrypt(reader["CategoryID"].ToString());

                                // Skip duplicate categories
                                if (categorySet.Contains(encryptedCategoryID)) continue;
                                categorySet.Add(encryptedCategoryID);

                                // Parse Brands JSON
                                var brandsJson = reader["BrandsJson"]?.ToString();
                                var brands = ParseBrandsJson(brandsJson);

                                var category = new
                                {
                                    CategoryID = encryptedCategoryID,
                                    CategoryName = reader["CategoryName"],
                                    Brands = brands
                                };

                                categories.Add(category);
                            }

                            return Ok(categories);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching data.", Error = ex.Message });
            }
        }

        private List<object> ParseBrandsJson(string brandsJson)
        {
            var brands = new List<object>();
            var brandSet = new HashSet<string>(); // To track unique brands

            if (!string.IsNullOrWhiteSpace(brandsJson))
            {
                var parsedBrands = Newtonsoft.Json.JsonConvert.DeserializeObject<List<dynamic>>(brandsJson);

                foreach (var brand in parsedBrands)
                {
                    var brandID = _encryptionHelper.Encrypt(brand.BrandID.ToString());

                    // Skip duplicate brands
                    if (brandSet.Contains(brandID)) continue;
                    brandSet.Add(brandID);

                    var brandObject = new
                    {
                        BrandID = brandID,
                        BrandName = brand.BrandName?.ToString(),
                        BrandImageBase64 = brand.BrandImageBase64?.ToString()
                    };

                    brands.Add(brandObject);
                }
            }

            return brands;
        }






        [HttpGet("products-by-brand-and-category")]
        public async Task<IActionResult> GetProductsByBrandAndCategory([FromQuery] string brandId, [FromQuery] string categoryId)
        {
            try
            {
                var decryptedBrandId = _encryptionHelper.Decrypt(brandId);
                var decryptedCategoryId = _encryptionHelper.Decrypt(categoryId);

                using (var connection = new SqlConnection(_dbContext.Database.GetConnectionString()))
                {
                    await connection.OpenAsync();

                    using (SqlCommand command = new SqlCommand("UN_GetProductsByBrandandCategory", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        command.Parameters.Add(new SqlParameter("@BrandID", SqlDbType.Int) { Value = int.Parse(decryptedBrandId) });
                        command.Parameters.Add(new SqlParameter("@CategoryID", SqlDbType.Int) { Value = int.Parse(decryptedCategoryId) });

                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            var products = new List<object>();
                            var productSet = new HashSet<string>(); // To track unique products

                            while (await reader.ReadAsync())
                            {
                                var encryptedProductId = _encryptionHelper.Encrypt(reader["ProductID"].ToString());

                                // Skip duplicate products
                                if (productSet.Contains(encryptedProductId)) continue;
                                productSet.Add(encryptedProductId);

                                // Parse Images JSON directly from the reader
                                var imagesJson = reader["Images"]?.ToString();
                                var images = DecodeImages(imagesJson);

                                var product = new
                                {
                                    ProductID = encryptedProductId,
                                    BrandID = brandId,
                                    ProductName = reader["ProductName"]?.ToString(),
                                    Description = reader["Description"]?.ToString(),
                                    CategoryID = categoryId,
                                    Quantity = reader["Quantity"]?.ToString(),
                                    Images = images
                                };

                                products.Add(product);
                            }

                            return Ok(products);
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { Message = "Database error", Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Unexpected error", Error = ex.Message });
            }
        }

        private List<string> DecodeImages(string imagesJson)
        {
            var images = new List<string>();

            if (!string.IsNullOrWhiteSpace(imagesJson))
            {
                try
                {
                    // Attempt to parse as an array of objects with the "Images" property
                    var parsedImages = JsonConvert.DeserializeObject<List<dynamic>>(imagesJson);

                    foreach (var imageObj in parsedImages)
                    {
                        if (imageObj?.Images != null)
                        {
                            images.Add(imageObj.Images.ToString());
                        }
                    }
                }
                catch (JsonSerializationException ex)
                {
                    Console.WriteLine($"Error parsing Images JSON: {ex.Message}");
                    Console.WriteLine($"Raw data: {imagesJson}");
                }
            }

            return images;
        }



        [HttpGet("GetProductDetails/{productId}")]
        public async Task<IActionResult> GetProductDetails(string productId)
        {
            try
            {
                var decryptedProductId = _encryptionHelper.Decrypt(productId);

                using (var connection = new SqlConnection(_dbContext.Database.GetConnectionString()))
                {
                    await connection.OpenAsync();

                    using (SqlCommand command = new SqlCommand("dbo.UN_GetProductsDetails", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.Add(new SqlParameter("@ProductID", SqlDbType.Int) { Value = int.Parse(decryptedProductId) });

                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            if (!reader.HasRows)
                                return NotFound(new { Message = "Product not found or unavailable" });

                            var productSet = new HashSet<string>(); // To track unique products
                            var products = new List<object>();

                            while (await reader.ReadAsync())
                            {
                                var encryptedProductId = _encryptionHelper.Encrypt(reader["ProductID"].ToString());

                                if (productSet.Contains(encryptedProductId)) continue;
                                productSet.Add(encryptedProductId);

                                var imagesJson = reader["Images"] != DBNull.Value ? reader["Images"].ToString() : null;
                                var images = imagesJson != null ? DecodeImages(imagesJson) : new List<string>();

                                var product = new
                                {
                                    ProductID = encryptedProductId,
                                    ProductName = reader["ProductName"] != DBNull.Value ? reader["ProductName"].ToString() : string.Empty,
                                    Description = reader["Description"] != DBNull.Value ? reader["Description"].ToString() : string.Empty,
                                    PricePerMsq = reader["PricePerMsq"] != DBNull.Value ? Convert.ToDecimal(reader["PricePerMsq"]) : 0m,
                                    QtyPerBox = reader["QtyPerBox"] != DBNull.Value ? Convert.ToInt32(reader["QtyPerBox"]) : 0,
                                    SqmPerBox = reader["SqmPerBox"] != DBNull.Value ? Convert.ToDecimal(reader["SqmPerBox"]) : 0m,
                                    Quantity = reader["Quantity"] != DBNull.Value ? Convert.ToInt32(reader["Quantity"]) : 0,
                                    Available = reader["Available"] != DBNull.Value ? Convert.ToBoolean(reader["Available"]) : false,
                                    BrandName = reader["BrandName"] != DBNull.Value ? reader["BrandName"].ToString() : string.Empty,
                                    CategoryName = reader["CategoryName"] != DBNull.Value ? reader["CategoryName"].ToString() : string.Empty,
                                    Images = images
                                };

                                products.Add(product);
                            }

                            return Ok(products.Count == 1 ? products[0] : products);
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { Message = "Database error", Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Unexpected error", Error = ex.Message });
            }
        }







    }
}
