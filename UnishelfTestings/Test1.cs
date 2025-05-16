using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unishelf.Server.Data;
using Unishelf.Server.Models;
using Unishelf.Server.Services.Products;

namespace UnishelfTestings
{
    [TestClass]
    public sealed class ProductsServicesTests
    {
        private ApplicationDbContext _dbContext;
        private Mock<EncryptionHelper> _mockEncryptionHelper;
        private ProductsServices _service;

        [TestInitialize]
        public void Setup()
        {
            // Set up in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ApplicationDbContext(options);
            _dbContext.Categories.AddRange(new List<Categories>
            {
                new Categories { CategoryID = 1, CategoryName = "Category1", CategoryEnabled = true },
                new Categories { CategoryID = 2, CategoryName = "Category2", CategoryEnabled = false },
                new Categories { CategoryID = 3, CategoryName = "Category3", CategoryEnabled = true }
            });
            _dbContext.SaveChanges();

            // Mock IDataProtectionProvider
            var mockDataProtectionProvider = new Mock<IDataProtectionProvider>();
            var mockDataProtector = new Mock<IDataProtector>();
            mockDataProtector.Setup(p => p.Protect(It.IsAny<byte[]>()))
                .Returns<byte[]>(b => Encoding.UTF8.GetBytes($"protected_{Encoding.UTF8.GetString(b)}"));
            mockDataProtector.Setup(p => p.Unprotect(It.IsAny<byte[]>()))
                .Returns<byte[]>(b => Encoding.UTF8.GetBytes(Encoding.UTF8.GetString(b).Replace("protected_", "")));
            mockDataProtectionProvider.Setup(p => p.CreateProtector(It.IsAny<string>())).Returns(mockDataProtector.Object);

            // Mock EncryptionHelper
            _mockEncryptionHelper = new Mock<EncryptionHelper>(mockDataProtectionProvider.Object);
            _mockEncryptionHelper.Setup(e => e.Encrypt(It.IsAny<string>()))
                .Returns<string>(s => $"encrypted_{s}");

            // Initialize ProductsServices
            _service = new ProductsServices(_dbContext, _mockEncryptionHelper.Object);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [TestMethod]
        public async Task GetActiveCategories_ReturnsOnlyEnabledCategories()
        {
            // Act
            var result = await _service.GetActiveCatrgories();

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.Count);
            dynamic firstCategory = result[0];
            dynamic secondCategory = result[1];
            Assert.AreEqual("encrypted_1", (string)firstCategory.CategoryID);
            Assert.AreEqual("Category1", (string)firstCategory.CategoryName);
            Assert.AreEqual("encrypted_3", (string)secondCategory.CategoryID);
            Assert.AreEqual("Category3", (string)secondCategory.CategoryName);
        }

        [TestMethod]
        public async Task GetActiveCategories_EmptyListWhenNoEnabledCategories()
        {
            // Arrange
            _dbContext.Categories.RemoveRange(_dbContext.Categories);
            _dbContext.Categories.Add(new Categories { CategoryID = 2, CategoryName = "Category2", CategoryEnabled = false });
            _dbContext.SaveChanges();

            // Act
            var result = await _service.GetActiveCatrgories();

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(0, result.Count);
        }

        [TestMethod]
        [ExpectedException(typeof(Exception))]
        public async Task GetActiveCategories_ThrowsExceptionOnDbError()
        {
            // Arrange
            var mockDbContext = new Mock<ApplicationDbContext>(new DbContextOptionsBuilder<ApplicationDbContext>().Options);
            mockDbContext.Setup(db => db.Categories).Throws(new Exception("Database error"));
            var service = new ProductsServices(mockDbContext.Object, _mockEncryptionHelper.Object);

            // Act
            await service.GetActiveCatrgories();

            // Assert is handled by ExpectedException
        }
    }
}