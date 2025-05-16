namespace UnishelfTesting
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.VisualStudio.TestTools.UnitTesting;
    using Moq;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using System.Text.Json;
    using global::Unishelf.Server.Models;
    using global::Unishelf.Server.Services.Products;
    using global::Unishelf.Server.Data;

    namespace Unishelf.Server.Tests.Services
    {
        [TestClass]
        public class ProductsServicesTests
        {
            private Mock<ApplicationDbContext> _dbContextMock;
            private Mock<EncryptionHelper> _encryptionHelperMock;
            private ProductsServices _productsServices;
            private Mock<DbSet<Categories>> _categoriesDbSetMock;
            private Mock<DbSet<Brands>> _brandsDbSetMock;
            private Mock<DbSet<Products>> _productsDbSetMock;
            private Mock<DbSet<Images>> _imagesDbSetMock;
            private Mock<DbSet<BrandImages>> _brandImagesDbSetMock;

            [TestInitialize]
            public void Setup()
            {
                var options = new DbContextOptionsBuilder<ApplicationDbContext>().Options;
                _dbContextMock = new Mock<ApplicationDbContext>(options);
                _encryptionHelperMock = new Mock<EncryptionHelper>();
                _categoriesDbSetMock = new Mock<DbSet<Categories>>();
                _brandsDbSetMock = new Mock<DbSet<Brands>>();
                _productsDbSetMock = new Mock<DbSet<Products>>();
                _imagesDbSetMock = new Mock<DbSet<Images>>();
                _brandImagesDbSetMock = new Mock<DbSet<BrandImages>>();

                _dbContextMock.Setup(db => db.Categories).Returns(_categoriesDbSetMock.Object);
                _dbContextMock.Setup(db => db.Brands).Returns(_brandsDbSetMock.Object);
                _dbContextMock.Setup(db => db.Products).Returns(_productsDbSetMock.Object);
                _dbContextMock.Setup(db => db.Images).Returns(_imagesDbSetMock.Object);
                _dbContextMock.Setup(db => db.BrandImages).Returns(_brandImagesDbSetMock.Object);

                _productsServices = new ProductsServices(_dbContextMock.Object, _encryptionHelperMock.Object);
            }

            [TestMethod]
            public async Task GetCategoriesWithBrandsAndImages_ReturnsCategoriesWithBrands()
            {
                // Arrange
                var categories = new List<Categories>
        {
            new Categories { CategoryID = 1, CategoryName = "Electronics", CategoryEnabled = true }
        };
                var brands = new List<Brands>
        {
            new Brands { BrandID = 1, BrandName = "BrandA", BrandEnabled = true }
        };
                var products = new List<Products>
        {
            new Products { ProductID = 1, BrandID = 1, CategoryID = 1 }
        };
                var brandImages = new List<BrandImages>
        {
            new BrandImages { BrandImagesID = 1, BrandID = 1, BrandImage = Encoding.UTF8.GetBytes("image") }
        };

                SetupDbSetMock(_categoriesDbSetMock, categories);
                SetupDbSetMock(_brandsDbSetMock, brands);
                SetupDbSetMock(_productsDbSetMock, products);
                SetupDbSetMock(_brandImagesDbSetMock, brandImages);

                _encryptionHelperMock.Setup(e => e.Encrypt("1")).Returns("encrypted_1");

                // Act
                var result = await _productsServices.GetCategoriesWithBrandsAndImages();

                // Assert
                Assert.AreEqual(1, result.Count);
                var category = result[0] as dynamic;
                Assert.AreEqual("encrypted_1", category.CategoryID);
                Assert.AreEqual("Electronics", category.CategoryName);
                Assert.AreEqual(1, category.Brands.Count);
                Assert.AreEqual("encrypted_1", category.Brands[0].BrandID);
                Assert.AreEqual("BrandA", category.Brands[0].BrandName);
                Assert.AreEqual(Convert.ToBase64String(Encoding.UTF8.GetBytes("image")), category.Brands[0].BrandImageBase64);
            }

            [TestMethod]
            public async Task GetBrandsByCategory_ReturnsBrandsForValidCategory()
            {
                // Arrange
                var categoryId = "encrypted_1";
                var categories = new List<Categories>
        {
            new Categories { CategoryID = 1, CategoryName = "Electronics", CategoryEnabled = true }
        };
                var brands = new List<Brands>
        {
            new Brands { BrandID = 1, BrandName = "BrandA", BrandEnabled = true }
        };
                var products = new List<Products>
        {
            new Products { ProductID = 1, BrandID = 1, CategoryID = 1 }
        };
                var brandImages = new List<BrandImages>
        {
            new BrandImages { BrandImagesID = 1, BrandID = 1, BrandImage = Encoding.UTF8.GetBytes("image") }
        };

                SetupDbSetMock(_categoriesDbSetMock, categories);
                SetupDbSetMock(_brandsDbSetMock, brands);
                SetupDbSetMock(_productsDbSetMock, products);
                SetupDbSetMock(_brandImagesDbSetMock, brandImages);

                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");
                _encryptionHelperMock.Setup(e => e.Encrypt("1")).Returns("encrypted_1");

                // Act
                var result = await _productsServices.GetBrandsByCategory(categoryId);

                // Assert
                var resultObj = result as dynamic;
                Assert.AreEqual("encrypted_1", resultObj.CategoryID);
                Assert.AreEqual("Electronics", resultObj.categoryName);
                Assert.AreEqual(1, resultObj.brands.Count);
                Assert.AreEqual("encrypted_1", resultObj.brands[0].BrandID);
                Assert.AreEqual("BrandA", resultObj.brands[0].BrandName);
                Assert.AreEqual(Convert.ToBase64String(Encoding.UTF8.GetBytes("image")), resultObj.brands[0].BrandImageBase64);
            }

            [TestMethod]
            public async Task GetBrandsByCategory_ReturnsEmptyForInvalidCategory()
            {
                // Arrange
                var categoryId = "encrypted_1";
                var categories = new List<Categories>();
                var brands = new List<Brands>();
                var products = new List<Products>();

                SetupDbSetMock(_categoriesDbSetMock, categories);
                SetupDbSetMock(_brandsDbSetMock, brands);
                SetupDbSetMock(_productsDbSetMock, products);

                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");

                // Act
                var result = await _productsServices.GetBrandsByCategory(categoryId);

                // Assert
                var resultObj = result as dynamic;
                Assert.AreEqual("", resultObj.categoryName);
                Assert.AreEqual(0, resultObj.brands.Count);
            }

            [TestMethod]
            public async Task GetProductsByBrandAndCategory_ReturnsProducts()
            {
                // Arrange
                var encryptedBrandId = "encrypted_1";
                var encryptedCategoryId = "encrypted_2";
                var products = new List<Products>
        {
            new Products
            {
                ProductID = 1,
                BrandID = 1,
                CategoryID = 2,
                ProductName = "ProductA",
                Description = "Desc",
                Price = 100,
                PricePerMsq = 10,
                Quantity = 5
            }
        };
                var images = new List<Images>
        {
            new Images { ImageID = 1, ProductID = 1, Image = Encoding.UTF8.GetBytes("image") }
        };

                SetupDbSetMock(_productsDbSetMock, products);
                SetupDbSetMock(_imagesDbSetMock, images);

                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");
                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_2")).Returns("2");
                _encryptionHelperMock.Setup(e => e.Encrypt("1")).Returns("encrypted_1");
                _encryptionHelperMock.Setup(e => e.Encrypt("2")).Returns("encrypted_2");

                // Act
                var result = await _productsServices.GetProductsByBrandAndCategory(encryptedBrandId, encryptedCategoryId);

                // Assert
                Assert.AreEqual(1, result.Count);
                var product = result[0] as dynamic;
                Assert.AreEqual("encrypted_1", product.ProductID);
                Assert.AreEqual("encrypted_1", product.BrandID);
                Assert.AreEqual("ProductA", product.ProductName);
                Assert.AreEqual("Desc", product.Description);
                Assert.AreEqual(100, product.Price);
                Assert.AreEqual(10, product.PricePerMsq);
                Assert.AreEqual("encrypted_2", product.CategoryID);
                Assert.AreEqual(5, product.Quantity);
                Assert.AreEqual(1, product.Images.Count);
                Assert.AreEqual(Convert.ToBase64String(Encoding.UTF8.GetBytes("image")), product.Images[0]);
            }

            [TestMethod]
            public async Task GetProductDetails_ReturnsProductDetails()
            {
                // Arrange
                var encryptedProductId = "encrypted_1";
                var products = new List<Products>
        {
            new Products
            {
                ProductID = 1,
                ProductName = "ProductA",
                Description = "Desc",
                PricePerMsq = 10,
                Price = 100,
                Currency = "USD",
                QtyPerBox = 5,
                Height = 10,
                Width = 20,
                Depth = 30,
                SqmPerBox = 2,
                Quantity = 50,
                Available = true,
                BrandID = 1,
                CategoryID = 1,
                Brands = new Brands { BrandID = 1, BrandName = "BrandA" },
                Categories = new Categories { CategoryID = 1, CategoryName = "Electronics" }
            }
        };
                var images = new List<Images>
        {
            new Images { ImageID = 1, ProductID = 1, Image = Encoding.UTF8.GetBytes("image") }
        };
                var brands = new List<Brands>
        {
            new Brands { BrandID = 1, BrandName = "BrandA" }
        };
                var categories = new List<Categories>
        {
            new Categories { CategoryID = 1, CategoryName = "Electronics" }
        };

                SetupDbSetMock(_productsDbSetMock, products);
                SetupDbSetMock(_imagesDbSetMock, images);
                SetupDbSetMock(_brandsDbSetMock, brands);
                SetupDbSetMock(_categoriesDbSetMock, categories);

                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");
                _encryptionHelperMock.Setup(e => e.Encrypt("1")).Returns("encrypted_1");

                // Act
                var result = await _productsServices.GetProductDetails(encryptedProductId);

                // Assert
                var product = result as dynamic;
                Assert.IsNotNull(product);
                Assert.AreEqual("encrypted_1", product.ProductID);
                Assert.AreEqual("ProductA", product.ProductName);
                Assert.AreEqual("Desc", product.Description);
                Assert.AreEqual(10.0, product.PricePerMsq);
                Assert.AreEqual(100.0, product.Price);
                Assert.AreEqual("USD", product.Currency);
                Assert.AreEqual(5, product.QtyPerBox);
                Assert.AreEqual(10, product.Height);
                Assert.AreEqual(20, product.Width);
                Assert.AreEqual(30, product.Depth);
                Assert.AreEqual(2.0, product.SqmPerBox);
                Assert.AreEqual(50, product.Quantity);
                Assert.IsTrue(product.Available);
                Assert.AreEqual("BrandA", product.BrandName);
                Assert.AreEqual("Electronics", product.CategoryName);
                Assert.AreEqual("encrypted_1", product.BrandID);
                Assert.AreEqual("encrypted_1", product.CategoryID);
                Assert.AreEqual(1, product.Images.Count);
                Assert.AreEqual("encrypted_1", product.Images[0].ImageID);
                Assert.AreEqual(Convert.ToBase64String(Encoding.UTF8.GetBytes("image")), product.Images[0].ImageData);
            }

            [TestMethod]
            public async Task AddImage_AddsImageSuccessfully()
            {
                // Arrange
                var encryptedProductId = "encrypted_1";
                var base64Image = Convert.ToBase64String(Encoding.UTF8.GetBytes("image"));
                var savedImage = new Images { ImageID = 0, ProductID = 1, Image = Encoding.UTF8.GetBytes("image") };

                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");
                _encryptionHelperMock.Setup(e => e.Encrypt("1")).Returns("encrypted_1");

                _dbContextMock.Setup(db => db.Images.Add(It.IsAny<Images>())).Callback<Images>(img => savedImage = img);
                _dbContextMock.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>())).Callback(() => savedImage.ImageID = 1).ReturnsAsync(1);

                // Act
                var result = await _productsServices.AddImage(encryptedProductId, base64Image);

                // Assert
                Assert.AreEqual("encrypted_1", result);
                _dbContextMock.Verify(db => db.Images.Add(It.Is<Images>(img => img.ProductID == 1 && img.Image.SequenceEqual(Encoding.UTF8.GetBytes("image")))), Times.Once());
                _dbContextMock.Verify(db => db.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once());
            }

            [TestMethod]
            [ExpectedException(typeof(ArgumentException))]
            public async Task AddImage_ThrowsExceptionForInvalidBase64()
            {
                // Arrange
                var encryptedProductId = "encrypted_1";
                var invalidBase64 = "invalid_base64";

                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");

                // Act
                await _productsServices.AddImage(encryptedProductId, invalidBase64);

                // Assert: Expect ArgumentException
            }

            [TestMethod]
            public async Task DeleteImage_DeletesImageSuccessfully()
            {
                // Arrange
                var encryptedImageId = "encrypted_1";
                var image = new Images { ImageID = 1, ProductID = 1, Image = Encoding.UTF8.GetBytes("image") };

                _imagesDbSetMock.Setup(m => m.FindAsync(1)).ReturnsAsync(image);
                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");
                _dbContextMock.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

                // Act
                var result = await _productsServices.DeleteImage(encryptedImageId);

                // Assert
                Assert.IsNotNull(result);
                Assert.AreEqual(1, result.ImageID);
                _dbContextMock.Verify(db => db.Images.Remove(It.Is<Images>(img => img.ImageID == 1)), Times.Once());
                _dbContextMock.Verify(db => db.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once());
            }

            [TestMethod]
            [ExpectedException(typeof(ArgumentException))]
            public async Task DeleteImage_ThrowsForNonExistentImage()
            {
                // Arrange
                var encryptedImageId = "encrypted_1";
                _encryptionHelperMock.Setup(e => e.Decrypt("encrypted_1")).Returns("1");
                _imagesDbSetMock.Setup(m => m.FindAsync(1)).ReturnsAsync((Images)null);

                // Act
                await _productsServices.DeleteImage(encryptedImageId);

                // Assert: Expect ArgumentException
            }

            private void SetupDbSetMock<T>(Mock<DbSet<T>> dbSetMock, List<T> data) where T : class
            {
                var queryable = data.AsQueryable();
                dbSetMock.As<IQueryable<T>>().Setup(m => m.Provider).Returns(queryable.Provider);
                dbSetMock.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
                dbSetMock.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
                dbSetMock.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(() => queryable.GetEnumerator());
            }
        }
    }
}