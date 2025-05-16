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
            int categoryGuid = int.Parse(_encryptionHelper.Decrypt(categoryID));

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

            if (categoryWithBrands == null)
            {
                return new { categoryName = "", brands = new List<object>() };
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
                    Price = p.Price,
                    PricePerMsq = p.PricePerMsq,
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

        public async Task<List<object>> GetActiveProductsByBrandAndCategory(string encryptedBrandId, string encryptedCategoryId)
        {
            var decryptedBrandId = _encryptionHelper.Decrypt(encryptedBrandId);
            var decryptedCategoryId = _encryptionHelper.Decrypt(encryptedCategoryId);

            var products = await _dbContext.Products
                .Where(p => p.BrandID == int.Parse(decryptedBrandId) &&
                            p.CategoryID == int.Parse(decryptedCategoryId) &&
                            p.Available == true)
                .Select(p => new
                {
                    ProductID = _encryptionHelper.Encrypt(p.ProductID.ToString()),
                    BrandID = encryptedBrandId,
                    BrandName = p.Brands.BrandName,
                    ProductName = p.ProductName,
                    Currency = p.Currency,
                    Description = p.Description,
                    Price = p.Price,
                    PricePerMsq = p.PricePerMsq,
                    CategoryID = encryptedCategoryId,
                    CategoryName = p.Categories.CategoryName,
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
            try
            {
                var decryptedProductId = _encryptionHelper.Decrypt(encryptedProductId);
                if (!int.TryParse(decryptedProductId, out int productId))
                {
                    throw new ArgumentException("Invalid ProductID format.");
                }

                var product = await _dbContext.Products
                    .Include(p => p.Brands)
                    .Include(p => p.Categories)
                    .Where(p => p.ProductID == productId)
                    .Select(p => new
                    {
                        ProductID = _encryptionHelper.Encrypt(p.ProductID.ToString()),
                        ProductName = p.ProductName,
                        Description = p.Description, // Return null if Description is null
                        PricePerMsq = p.PricePerMsq.HasValue ? (double?)p.PricePerMsq.Value : null,
                        Price = p.Price.HasValue ? (double?)p.Price.Value : null,
                        Currency = p.Currency ?? "",
                        QtyPerBox = p.QtyPerBox.HasValue ? (int?)p.QtyPerBox.Value : null,
                        Height = p.Height.HasValue ? (int?)p.Height.Value : null,
                        Width = p.Width.HasValue ? (int?)p.Width.Value : null,
                        Depth = p.Depth.HasValue ? (int?)p.Depth.Value : null,
                        SqmPerBox = p.SqmPerBox.HasValue ? (double?)p.SqmPerBox.Value : null,
                        Quantity = p.Quantity.HasValue ? (int?)p.Quantity.Value : null,
                        Available = p.Available,
                        BrandName = p.Brands != null ? p.Brands.BrandName ?? "No brand available" : "No brand available",
                        CategoryName = p.Categories != null ? p.Categories.CategoryName ?? "No category available" : "No category available",
                        BrandID = _encryptionHelper.Encrypt(p.BrandID.ToString()),
                        CategoryID = _encryptionHelper.Encrypt(p.CategoryID.ToString()),
                        Images = _dbContext.Images
                            .Where(img => img.ProductID == p.ProductID)
                            .OrderBy(img => img.ImageID)
                            .Select(img => new
                            {
                                ImageID = _encryptionHelper.Encrypt(img.ImageID.ToString()),
                                ImageData = img.Image != null ? Convert.ToBase64String(img.Image) : ""
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                if (product == null)
                {
                    return new { Error = "Product not found." };
                }

                return product;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error fetching product details: {ex.Message}");
            }
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

                // Handle productID
                int productID = 0;
                if (data.TryGetProperty("productID", out var productIDProp) && productIDProp.ValueKind != JsonValueKind.Null)
                {
                    string encryptedProductID = productIDProp.GetString();
                    if (!string.IsNullOrEmpty(encryptedProductID) && encryptedProductID != "0")
                    {
                        productID = int.Parse(_encryptionHelper.Decrypt(encryptedProductID));
                    }
                }

                // Required fields
                string categoryIDStr = data.TryGetProperty("categoryID", out var categoryIDProp) && categoryIDProp.ValueKind != JsonValueKind.Null
                    ? categoryIDProp.GetString()
                    : null;
                int categoryID = string.IsNullOrEmpty(categoryIDStr) ? 0 : int.Parse(_encryptionHelper.Decrypt(categoryIDStr));

                string brandIDStr = data.TryGetProperty("brandID", out var brandIDProp) && brandIDProp.ValueKind != JsonValueKind.Null
                    ? brandIDProp.GetString()
                    : null;
                int brandID = string.IsNullOrEmpty(brandIDStr) ? 0 : int.Parse(_encryptionHelper.Decrypt(brandIDStr));

                // Safe parsing functions
                int? TryParseInt(string propertyName)
                {
                    if (!data.TryGetProperty(propertyName, out var prop) || prop.ValueKind == JsonValueKind.Null)
                        return null; // Return null instead of 0
                    if (prop.ValueKind == JsonValueKind.String)
                    {
                        string value = prop.GetString();
                        return string.IsNullOrEmpty(value) ? null : int.Parse(value);
                    }
                    return prop.GetInt32();
                }

                double? TryParseDouble(string propertyName)
                {
                    if (!data.TryGetProperty(propertyName, out var prop) || prop.ValueKind == JsonValueKind.Null)
                        return null; // Return null instead of 0f
                    if (prop.ValueKind == JsonValueKind.String)
                    {
                        string value = prop.GetString();
                        return string.IsNullOrEmpty(value) ? null : double.Parse(value);
                    }
                    return prop.GetDouble();
                }

                string TryParseString(string propertyName)
                {
                    if (!data.TryGetProperty(propertyName, out var prop) || prop.ValueKind == JsonValueKind.Null)
                        return null;
                    string value = prop.GetString();
                    return string.IsNullOrEmpty(value) ? null : value;
                }

                // Parse values
                string productName = TryParseString("productName");
                string description = TryParseString("description");
                string currency = TryParseString("currency");
                int? height = TryParseInt("height");
                int? width = TryParseInt("width");
                int? depth = TryParseInt("depth");
                double? pricePerMsq = TryParseDouble("pricePerMsq");
                double? price = TryParseDouble("price");
                double? sqmPerBox = TryParseDouble("sqmPerBox");
                int? qtyPerBox = TryParseInt("qtyPerBox");
                int? quantity = TryParseInt("quantity");
                bool available = data.TryGetProperty("available", out var availableProp) && availableProp.ValueKind == JsonValueKind.True;

                // Handle images
                IEnumerable<string> imagesArray = data.TryGetProperty("imageData", out var imageDataProp) && imageDataProp.ValueKind == JsonValueKind.Array
                    ? imageDataProp.EnumerateArray().Select(e => e.GetString()).Where(s => !string.IsNullOrEmpty(s))
                    : new List<string>();

                // Validation
                if (string.IsNullOrEmpty(productName))
                {
                    return "Product name is required.";
                }
                if (categoryID == 0)
                {
                    return "Category ID is required.";
                }
                if (brandID == 0)
                {
                    return "Brand ID is required.";
                }

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
                        Currency = currency,
                        QtyPerBox = qtyPerBox,
                        SqmPerBox = sqmPerBox,
                        Quantity = quantity,
                        Available = available
                    };

                    _dbContext.Products.Add(product);
                    await _dbContext.SaveChangesAsync();
                    productID = product.ProductID;
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
                    product.Description = description;
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
                }

                // Handle images
                foreach (var imageBase64 in imagesArray)
                {
                    if (!string.IsNullOrEmpty(imageBase64))
                    {
                        var imageBytes = Convert.FromBase64String(imageBase64);
                        var image = new Images
                        {
                            ProductID = productID,
                            Image = imageBytes
                        };
                        _dbContext.Images.Add(image);
                        await _dbContext.SaveChangesAsync();
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
                    .Where(b => b.BrandEnabled)
                    .Select(b => new
                    {
                        BrandID = _encryptionHelper.Encrypt(b.BrandID.ToString()),
                        BrandName = b.BrandName
                    })
                    .ToListAsync();

                return brands.Cast<object>().ToList();
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
                    .Where(c => c.CategoryEnabled)
                    .Select(c => new
                    {
                        categoryID = _encryptionHelper.Encrypt(c.CategoryID.ToString()),
                        categoryName = c.CategoryName
                    })
                    .ToListAsync();

                return categories.Cast<object>().ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Internal error: {ex.Message}");
            }
        }
    }
}