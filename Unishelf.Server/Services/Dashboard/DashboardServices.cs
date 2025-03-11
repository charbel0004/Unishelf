using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Web.WebPages;
using Unishelf.Server.Data;
using Unishelf.Server.Models;

namespace Unishelf.Server.Services.Dashboard
{
    public class DashboardServices
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly EncryptionHelper _encryptionHelper;


        public DashboardServices(EncryptionHelper encryptionHelper, ApplicationDbContext dbContext)
        {
            _encryptionHelper = encryptionHelper;
            _dbContext = dbContext;
        }


        public async Task<List<object>> GetBrands()
        {
            try
            {
                var brands = await _dbContext.Brands
                    .Include(b => b.BrandImages) // Include related images
                    .Select(b => new
                    {
                        BrandID = _encryptionHelper.Encrypt(b.BrandID.ToString()), // Encrypt BrandID
                        BrandName = b.BrandName,
                        BrandEnabled = b.BrandEnabled,
                        BrandImageID = _encryptionHelper.Encrypt(b.BrandImages
                            .Where(img => img.BrandImage != null) // Filter out null images
                            .Select(img => img.BrandImagesID) // Get the image ID
                            .FirstOrDefault().ToString()),
                        BrandImage = b.BrandImages
                            .Where(img => img.BrandImage != null) // Filter out null images
                            .Select(img => Convert.ToBase64String(img.BrandImage)) // Convert image to Base64
                            .FirstOrDefault(), // Get only the first image
                    })
                    .ToListAsync();

                return brands.Cast<object>().ToList(); // Ensuring List<object> return type
            }
            catch (Exception ex)
            {
                throw new Exception($"Internal error: {ex.Message}");
            }
        }


        public async Task<int> AddOrUpdateBrand(string? brandId, string brandName, bool isActive, string base64Image, string? brandImageId = null)
        {
            if (string.IsNullOrWhiteSpace(brandName))
                throw new ArgumentException("Brand name is required.");

            Brands brand;

            if (string.IsNullOrEmpty(brandId))
            {
                // Create new brand
                brand = new Brands
                {
                    BrandName = brandName,
                    BrandEnabled = isActive
                };

                _dbContext.Brands.Add(brand);
            }
            else
            {
                // Decrypt the brandId if it's provided
                int decryptedId = int.Parse(_encryptionHelper.Decrypt(brandId));

                // Update existing brand using decryptedId
                brand = await _dbContext.Brands.FindAsync(decryptedId);
                if (brand == null)
                    throw new KeyNotFoundException("Brand not found.");

                brand.BrandName = brandName;
                brand.BrandEnabled = isActive;

                _dbContext.Brands.Update(brand);
            }

            try
            {
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Add error handling for saving changes to the database
                throw new Exception("Error saving the brand to the database: " + ex.Message);
            }

            // Image handling: Add or update brand image
            if (!string.IsNullOrEmpty(base64Image))
            {
                try
                {
                    byte[] imageBytes = Convert.FromBase64String(base64Image);

                    // If it's a new brand, the brand ID will be populated after saving
                    // For an existing brand, the ID is already set in `brand.BrandID`
                    int brandIdToUse = brand.BrandID;

                    BrandImages brandImageEntity = null;

                    // If a specific BrandImageID is provided, decrypt and update that image
                    if (!string.IsNullOrEmpty(brandImageId))
                    {
                        int decryptedImageId = int.Parse(_encryptionHelper.Decrypt(brandImageId));

                        // Find the specific image by its decrypted ID and associated brand ID
                        brandImageEntity = await _dbContext.BrandImages
                            .FirstOrDefaultAsync(bi => bi.BrandImagesID == decryptedImageId && bi.BrandID == brandIdToUse);
                    }
                    else
                    {
                        // If no specific image ID is provided, find the first image for the brand
                        brandImageEntity = await _dbContext.BrandImages
                            .FirstOrDefaultAsync(bi => bi.BrandID == brandIdToUse);
                    }

                    if (brandImageEntity != null)
                    {
                        // Update existing image
                        brandImageEntity.BrandImage = imageBytes;
                        _dbContext.BrandImages.Update(brandImageEntity);
                    }
                    else
                    {
                        // Add new image if no existing image found
                        var newBrandImage = new BrandImages
                        {
                            BrandID = brandIdToUse,
                            BrandImage = imageBytes
                        };

                        _dbContext.BrandImages.Add(newBrandImage);
                    }

                    await _dbContext.SaveChangesAsync();
                }
                catch (FormatException fe)
                {
                    throw new ArgumentException("Invalid base64 string format for the image.", fe);
                }
                catch (Exception ex)
                {
                    // Handle errors in saving the image to the database
                    throw new Exception("Error saving brand image: " + ex.Message);
                }
            }

            return brand.BrandID;
        }





        public async Task<List<object>> GetCategories()
        {
            var categories = await _dbContext.Categories.ToListAsync();

            var encryptedCategories = categories.Select(category => new
            {
                EncryptedCategoryId = _encryptionHelper.Encrypt(category.CategoryID.ToString()), // Encrypt CategoryId
                category.CategoryName,
                category.CategoryEnabled
            }).ToList();

             return encryptedCategories.Cast<object>().ToList(); ;
        }





        public async Task<int> AddOrUpdateCategory(string? categoryId, string categoryName, bool isActive)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
                throw new ArgumentException("Category name is required.");

            Categories category;

            try
            {
                if (string.IsNullOrEmpty(categoryId))
                {
                    category = new Categories
                    {
                        CategoryName = categoryName,
                        CategoryEnabled = isActive
                    };

                    _dbContext.Categories.Add(category);
                }
                else
                {
                    if (!int.TryParse(_encryptionHelper.Decrypt(categoryId), out int decryptedId))
                        throw new ArgumentException("Invalid category ID.");

                    category = await _dbContext.Categories.FindAsync(decryptedId);
                    if (category == null)
                        throw new KeyNotFoundException("Category not found.");

                    category.CategoryName = categoryName;
                    category.CategoryEnabled = isActive;

                    _dbContext.Categories.Update(category);
                }

                await _dbContext.SaveChangesAsync();
                return category.CategoryID;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving category: {ex.Message}");
            }
        }



        public async Task<bool> UpdateCategoryEnabled(string categoryId, bool isEnabled)
        {
            int decryptedID = int.Parse(_encryptionHelper.Decrypt(categoryId));
            var category = await _dbContext.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == decryptedID);

            if (category == null)
            {
                return false; // Category not found
            }

            category.CategoryEnabled = isEnabled;

            // Save changes to the database
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateBrandEnabled(string brandId, bool isEnabled)
        {
            int decryptedID = int.Parse(_encryptionHelper.Decrypt(brandId));
            var brand = await _dbContext.Brands
                .FirstOrDefaultAsync(b => b.BrandID == decryptedID);

            if (brand == null)
            {
                return false; // Category not found
            }

            brand.BrandEnabled = isEnabled;

            // Save changes to the database
            await _dbContext.SaveChangesAsync();

            return true;
        }


    }
}
