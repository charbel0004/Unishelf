using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Text.Json.Nodes;
using Unishelf.Server.Data;
using Unishelf.Server.Models;
using static System.Net.Mime.MediaTypeNames;

namespace Unishelf.Server.Services.Products
{
    public class ProductsServices : IProductsService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly EncryptionHelper _encryptionHelper;


        public ProductsServices(ApplicationDbContext dbContext, EncryptionHelper encryptionHelper)
        {
            _dbContext = dbContext;
            _encryptionHelper = encryptionHelper;
        }

        public async Task<List<object>> GetCategoriesWithBrandsAndImages()
        {
            var categories = await _dbContext.Categories
                .Where(c => c.CategoryEnabled)
                .Select(c => new
                {
                    CategoryID = _encryptionHelper.Encrypt(c.CategoryID.ToString()),
                    CategoryName = c.CategoryName,
                    Brands = _dbContext.Brands
                        .Where(b => b.BrandEnabled && _dbContext.Products
                            .Any(p => p.BrandID == b.BrandID && p.CategoryID == c.CategoryID))
                        .Select(b => new
                        {
                            BrandID = _encryptionHelper.Encrypt(b.BrandID.ToString()),
                            BrandName = b.BrandName,
                            BrandImageBase64 = _dbContext.BrandImages
                                .Where(img => img.BrandID == b.BrandID)
                                .OrderByDescending(img => img.BrandImagesID)
                                .Select(img => img.BrandImage != null ? Convert.ToBase64String(img.BrandImage) : null)
                                .FirstOrDefault()
                        })
                        .ToList()
                })
                .ToListAsync();

            return categories.Cast<object>().ToList();
        }


        public async Task<object> GetBrandsByCategory(string categoryID)
        {
            int categoryGuid = int.Parse(_encryptionHelper.Decrypt(categoryID)); // Decrypt the categoryID

            var categoryWithBrands = await _dbContext.Categories
                .Where(c => c.CategoryID == categoryGuid && c.CategoryEnabled)
                .Select(c => new
                {
                    CategoryID = _encryptionHelper.Encrypt(c.CategoryID.ToString()),
                    CategoryName = c.CategoryName,
                    Brands = _dbContext.Brands
                        .Where(b => b.BrandEnabled && _dbContext.Products
                            .Any(p => p.BrandID == b.BrandID && p.CategoryID == c.CategoryID))
                        .Select(b => new
                        {
                            BrandID = _encryptionHelper.Encrypt(b.BrandID.ToString()),
                            BrandName = b.BrandName,
                            BrandImageBase64 = _dbContext.BrandImages
                                .Where(img => img.BrandID == b.BrandID)
                                .OrderByDescending(img => img.BrandImagesID)
                                .Select(img => img.BrandImage != null ? Convert.ToBase64String(img.BrandImage) : null)
                                .FirstOrDefault()
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            // Check if the category exists
            if (categoryWithBrands == null)
            {
                return new { categoryName = "", brands = new List<object>() }; // Return an object with empty values if no category is found
            }

            return new { categoryName = categoryWithBrands.CategoryName, brands = categoryWithBrands.Brands };
        }



        public async Task<List<object>> GetProductsByBrandAndCategory(string encryptedBrandId, string encryptedCategoryId)
        {
            var decryptedBrandId = _encryptionHelper.Decrypt(encryptedBrandId);
            var decryptedCategoryId = _encryptionHelper.Decrypt(encryptedCategoryId);

            var products = await _dbContext.Products
                .Where(p => p.BrandID == int.Parse(decryptedBrandId) && p.CategoryID == int.Parse(decryptedCategoryId))
                .Select(p => new
                {
                    ProductID = _encryptionHelper.Encrypt(p.ProductID.ToString()),
                    BrandID = encryptedBrandId,
                    ProductName = p.ProductName,
                    Description = p.Description,
                    CategoryID = encryptedCategoryId,
                    Quantity = p.Quantity,
                    Images = _dbContext.Images
                        .Where(img => img.ProductID == p.ProductID)
                        .OrderBy(img => img.ImageID)
                        .Select(img => Convert.ToBase64String(img.Image))
                        .ToList()
                })
                .ToListAsync();

            return products.Cast<object>().ToList();
        }

        public async Task<object> GetProductDetails(string encryptedProductId)
        {
            var decryptedProductId = _encryptionHelper.Decrypt(encryptedProductId);

            var product = await _dbContext.Products
                .Where(p => p.ProductID == int.Parse(decryptedProductId))
                .Select(p => new
                {
                    ProductID = _encryptionHelper.Encrypt(p.ProductID.ToString()),
                    ProductName = p.ProductName ?? "No name available",
                    Description = p.Description ?? "No description available",
                    PricePerMsq = p.PricePerMsq.HasValue ? (double)p.PricePerMsq.Value : 0.0, // Handling nullable double
                    Price = p.Price.HasValue ? (double)p.Price.Value : 0, // Handling nullable int
                    Currency = p.Currency ?? "",
                    QtyPerBox = p.QtyPerBox.HasValue ? p.QtyPerBox.Value : 0, // Handling nullable int
                    Height = p.Height.HasValue ? p.Height.Value : 0, // Handling nullable int
                    Width = p.Width.HasValue ? p.Width.Value : 0, // Handling nullable int
                    Depth = p.Depth.HasValue ? p.Depth.Value : 0, // Handling nullable int
                    SqmPerBox = p.SqmPerBox.HasValue ? p.SqmPerBox.Value : 0.0, // Handling nullable double
                    Quantity = p.Quantity.HasValue ? p.Quantity.Value : 0, // Handling nullable int
                    Available = p.Available, // No need for null check as Available is non-nullable
                    BrandName = p.Brands.BrandName ?? "No brand available", // Check Brands entity
                    CategoryName = p.Categories.CategoryName ?? "No category available", // Check Categories entity
                    BrandID = _encryptionHelper.Encrypt(p.BrandID.ToString()),
                    CategoryID = _encryptionHelper.Encrypt(p.CategoryID.ToString()),
                    Images = _dbContext.Images
                        .Where(img => img.ProductID == p.ProductID)
                        .OrderBy(img => img.ImageID)
                        .Select(img => new
                        {
                            ImageID = _encryptionHelper.Encrypt((img.ImageID).ToString()), // Include ImageID
                            ImageData = Convert.ToBase64String(img.Image) // Base64-encoded image
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            return product;
        }

        public async Task<string> AddImage(string encryptedProductId, string base64Image)
        {
            if (string.IsNullOrEmpty(encryptedProductId) || string.IsNullOrEmpty(base64Image))
            {
                throw new ArgumentException("ProductID and Base64Image are required.");
            }

            try
            {
                int decryptedProductId = int.Parse(_encryptionHelper.Decrypt(encryptedProductId));

                byte[] imageBytes = Convert.FromBase64String(base64Image);

                var image = new Images
                {
                    ProductID = decryptedProductId,
                    Image = imageBytes
                };

                _dbContext.Images.Add(image);
                await _dbContext.SaveChangesAsync();

                // After saving, ImageID is generated
                string encryptedImageId = _encryptionHelper.Encrypt(image.ImageID.ToString());

                return encryptedImageId;
            }
            catch (FormatException)
            {
                throw new ArgumentException("Invalid ProductID format or Base64 string.");
            }
            catch (Exception ex)
            {
                throw new Exception($"Internal error: {ex.Message}");
            }
        }



        public async Task<Images> DeleteImage(string encryptedImageId)
        {
            try
            {
                int decryptedImageId = int.Parse(_encryptionHelper.Decrypt(encryptedImageId));

                var image = await _dbContext.Images.FindAsync(decryptedImageId);
                
              

                _dbContext.Images.Remove(image);
                await _dbContext.SaveChangesAsync();
                return image;
            }
            catch (FormatException)
            {
                throw new ArgumentException("Invalid ImageID format.");
            }
            catch (Exception ex)
            {
                throw new Exception($"Internal error: {ex.Message}");
            }
        }


        public async Task<string> AddOrUpdateProduct(JsonElement request)
        {
            try
            {
                JsonElement data = request.GetProperty("data");

                // Handle productID safely
                int productID = 0; // Default for new products
                if (data.TryGetProperty("productID", out var productIDProp) && productIDProp.ValueKind != JsonValueKind.Null)
                {
                    string encryptedProductID = productIDProp.ToString();
                    if (!string.IsNullOrEmpty(encryptedProductID) && encryptedProductID != "0")
                    {
                        productID = int.Parse(_encryptionHelper.Decrypt(encryptedProductID));
                    }
                }

                int categoryID = int.Parse(_encryptionHelper.Decrypt(data.GetProperty("categoryID").ToString()));
                int brandID = int.Parse(_encryptionHelper.Decrypt(data.GetProperty("brandID").ToString()));

                // Safe parsing functions
                int? TryParseInt(string propertyName)
                {
                    return data.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.Number
                        ? prop.GetInt32()
                        : (prop.ValueKind == JsonValueKind.String ? int.Parse(prop.GetString()) : (int?)null);
                }

                float? TryParseFloat(string propertyName)
                {
                    return data.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.Number
                        ? prop.GetSingle()
                        : (prop.ValueKind == JsonValueKind.String ? float.Parse(prop.GetString()) : (float?)null);
                }

                // Parse values
                int? height = TryParseInt("height");
                int? width = TryParseInt("width");
                int? depth = TryParseInt("depth");
                float? pricePerMsq = TryParseFloat("pricePerMsq");
                float? price = TryParseFloat("price");
                int? sqmPerBox = TryParseInt("sqmPerBox");
                int? qtyPerBox = TryParseInt("qtyPerBox");
                int? quantity = TryParseInt("quantity");
                

                bool available = data.TryGetProperty("available", out var availableProp) && availableProp.ValueKind == JsonValueKind.True;

                // Handling multiple images as JsonArray
                // Handling multiple images as JsonArray
                IEnumerable<JsonElement> imagesArray = data.TryGetProperty("imageData", out var imageDataProp) && imageDataProp.ValueKind == JsonValueKind.Array
                    ? imageDataProp.EnumerateArray()  // Using EnumerateArray() to get an IEnumerable<JsonElement>
                    : new List<JsonElement>();         // Default to an empty list if no images
                                                       // Default to empty array if no images

                string description = data.TryGetProperty("description", out var descProp) && descProp.ValueKind == JsonValueKind.String
                    ? descProp.GetString()
                    : null;

                string productName = data.TryGetProperty("productName", out var nameProp) && nameProp.ValueKind == JsonValueKind.String
                    ? nameProp.GetString()
                    : null;

                string currency = data.TryGetProperty("currency", out var currencyProp) && currencyProp.ValueKind == JsonValueKind.String
                    ? currencyProp.GetString()
                    : null;


                // Debugging logs
                Console.WriteLine($"Product ID: {productID}, Name: {productName}, Price: {price}");

                Unishelf.Server.Models.Products product;

                if (productID == 0)
                {
                    // Insert new product
                    product = new Unishelf.Server.Models.Products
                    {
                        ProductName = productName,
                        Description = description,
                        BrandID = brandID,
                        CategoryID = categoryID,
                        Height = height,
                        Width = width,
                        Depth = depth,
                        PricePerMsq = pricePerMsq,
                        Price = price,
                        Currency= currency,
                        QtyPerBox = qtyPerBox,
                        SqmPerBox = sqmPerBox,
                        Quantity = quantity,
                        Available = available
                    };

                    _dbContext.Products.Add(product);
                    await _dbContext.SaveChangesAsync(); // Get the generated ProductID
                    productID = product.ProductID; // Assign the new ProductID

                    Console.WriteLine("New product added successfully.");
                }
                else
                {
                    // Update existing product
                    product = await _dbContext.Products
                        .Include(p => p.Images)
                        .FirstOrDefaultAsync(p => p.ProductID == productID);

                    if (product == null)
                    {
                        return "Product not found.";
                    }

                    product.ProductName = productName ?? product.ProductName;
                    product.Description = description ?? product.Description;
                    product.BrandID = brandID;
                    product.CategoryID = categoryID;
                    product.Height = height ?? product.Height;
                    product.Width = width ?? product.Width;
                    product.Depth = depth ?? product.Depth;
                    product.PricePerMsq = pricePerMsq ?? product.PricePerMsq;
                    product.Price = price ?? product.Price;
                    product.Currency = currency ?? product.Currency;
                    product.QtyPerBox = qtyPerBox ?? product.QtyPerBox;
                    product.SqmPerBox = sqmPerBox ?? product.SqmPerBox;
                    product.Quantity = quantity ?? product.Quantity;
                    product.Available = available;

                    await _dbContext.SaveChangesAsync();
                    Console.WriteLine("Product updated successfully.");
                }

                // Handle multiple images
                foreach (var imageElement in imagesArray)
                {
                    string imageBase64 = imageElement.ToString().Trim('"'); // Remove surrounding quotes
                    if (!string.IsNullOrEmpty(imageBase64))
                    {
                        var imageBytes = Convert.FromBase64String(imageBase64);
                        var image = new Images
                        {
                            ProductID = productID, // Correct ProductID
                            Image = imageBytes
                        };
                        _dbContext.Images.Add(image);
                        await _dbContext.SaveChangesAsync();
                        Console.WriteLine("Image added successfully.");
                    }
                }

                return "Product added/updated successfully.";
            }
            catch (FormatException ex)
            {
                Console.WriteLine($"Format Error: {ex.Message}");
                return $"Invalid data format: {ex.Message}";
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Database Error: {ex.Message}");
                return $"Database error: {ex.Message}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Internal Error: {ex.Message}");
                return $"Internal error: {ex.Message}";
            }
        }




        public async Task<List<object>> GetActiveBrands()
        {
            try
            {
                var brands = await _dbContext.Brands
                    .Where(b => b.BrandEnabled) // Assuming 'BrandEnabled' is a boolean column
                    .Select(b => new
                    {
                        BrandID = _encryptionHelper.Encrypt(b.BrandID.ToString()),
                        BrandName = b.BrandName
                    })
                    .ToListAsync();

                return brands.Cast<object>().ToList(); // Ensuring List<object> return type
            }
            catch (Exception ex)
            {
                throw new Exception($"Internal error: {ex.Message}");
            }
        } 
        
        
        public async Task<List<object>> GetActiveCatrgories()
        {
            try
            {
                var categories = await _dbContext.Categories
                    .Where(c => c.CategoryEnabled) // Assuming 'BrandEnabled' is a boolean column
                    .Select(c => new
                    {
                        CategoryID = _encryptionHelper.Encrypt(c.CategoryID.ToString()),
                        CategoryName = c.CategoryName
                    })
                    .ToListAsync();

                return categories.Cast<object>().ToList(); // Ensuring List<object> return type
            }
            catch (Exception ex)
            {
                throw new Exception($"Internal error: {ex.Message}");
            }
        }



    }
}
