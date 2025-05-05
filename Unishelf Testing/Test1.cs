using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Unishelf.Models;
using Unishelf.Server;
using Unishelf.Server.Data;
using Unishelf.Server.Services.Users;

namespace Unishelf_Testing.Controllers
{
    [TestClass]
    public class UserManagementControllerIntegrationTests
    {
        private WebApplicationFactory<Startup> _factory;
        private HttpClient _client;
        private ApplicationDbContext _dbContext;
        private Mock<IUserService> _mockUserService;
        private Mock<IEncryptionHelper> _mockEncryptionHelper;

        public class UserResponse
        {
            public string EncryptedUserID { get; set; }
            public string UserName { get; set; }
            public string EmailAddress { get; set; }
            public bool IsCustomer { get; set; }
            public bool IsEmployee { get; set; }
            public bool IsManager { get; set; }
            public bool Active { get; set; }
        }

        [TestInitialize]
        public void Setup()
        {
            _mockUserService = new Mock<IUserService>();
            _mockEncryptionHelper = new Mock<IEncryptionHelper>();

            _factory = new WebApplicationFactory<Startup>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Replace DbContext with In-Memory
                        var descriptor = services.SingleOrDefault(
                            d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                        if (descriptor != null)
                            services.Remove(descriptor);

                        services.AddDbContext<ApplicationDbContext>(options =>
                            options.UseInMemoryDatabase("TestDb"));

                        // Replace IUserService and IEncryptionHelper with mocks
                        services.AddScoped(_ => _mockUserService.Object);
                        services.AddScoped(_ => _mockEncryptionHelper.Object);

                        var sp = services.BuildServiceProvider();

                        using (var scope = sp.CreateScope())
                        {
                            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                            db.Database.EnsureDeleted(); // Clear previous data
                            db.Database.EnsureCreated();
                            _dbContext = db;
                        }
                    });
                });

            _client = _factory.CreateClient();
        }

        [TestCleanup]
        public void Cleanup()
        {
            _factory.Dispose();
        }

        [TestMethod]
        public async Task GetUsers_ReturnsOkAndEncryptedUserData()
        {
            // Arrange
            var users = new List<User>
            {
                new User { UserID = 1, UserName = "testuser1", EmailAddress = "test1@example.com", IsCustomer = true, IsEmployee = false, IsManager = false, Active = true },
                new User { UserID = 2, UserName = "testuser2", EmailAddress = "test2@example.com", IsCustomer = false, IsEmployee = true, IsManager = false, Active = true },
            };

            _mockUserService.Setup(s => s.GetAllUsersAsync()).ReturnsAsync(users);
            _mockEncryptionHelper.Setup(h => h.Encrypt("1")).Returns("encrypted1");
            _mockEncryptionHelper.Setup(h => h.Encrypt("2")).Returns("encrypted2");

            // Act
            var response = await _client.GetAsync("/api/UserManagement/GetUsers");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var result = await response.Content.ReadFromJsonAsync<List<UserResponse>>();
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.Count);
            Assert.AreEqual("encrypted1", result[0].EncryptedUserID);
            Assert.AreEqual("testuser1", result[0].UserName);
            Assert.AreEqual("test1@example.com", result[0].EmailAddress);
            Assert.IsTrue(result[0].IsCustomer);
            Assert.IsFalse(result[0].IsEmployee);
            Assert.IsFalse(result[0].IsManager);
            Assert.IsTrue(result[0].Active);
        }

        [TestMethod]
        public async Task UpdateUserField_ValidRequest_ReturnsOk()
        {
            // Arrange
            string encryptedUserId = "encrypted1";
            string fieldName = "IsCustomer";
            bool newValue = false;

            _mockEncryptionHelper.Setup(h => h.Decrypt(encryptedUserId)).Returns("1");
            _mockUserService.Setup(s => s.UpdateUserFieldAsync("1", fieldName, newValue)).ReturnsAsync(true);

            // Act
            var response = await _client.PostAsync($"/api/UserManagement/UpdateUserField?encryptedUserId={encryptedUserId}&fieldName={fieldName}&value={newValue}", null);

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
            Assert.IsNotNull(result);
            Assert.AreEqual("Field updated successfully.", result["message"]);
        }

        [TestMethod]
        public async Task UpdateUserField_MissingParameters_ReturnsBadRequest()
        {
            // Act
            var response = await _client.PostAsync("/api/UserManagement/UpdateUserField?encryptedUserId=someId", null);

            // Assert
            Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [TestMethod]
        public async Task UpdateUserField_InvalidUserOrField_ReturnsBadRequest()
        {
            // Arrange
            string encryptedUserId = "encrypted1";
            string fieldName = "NonExistentField";
            bool newValue = true;

            _mockEncryptionHelper.Setup(h => h.Decrypt(encryptedUserId)).Returns("1");
            _mockUserService.Setup(s => s.UpdateUserFieldAsync("1", fieldName, newValue)).ReturnsAsync(false);

            // Act
            var response = await _client.PostAsync($"/api/UserManagement/UpdateUserField?encryptedUserId={encryptedUserId}&fieldName={fieldName}&value={newValue}", null);

            // Assert
            Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<string>();
            Assert.AreEqual("Failed to update field. Invalid user or field name.", result);
        }
    }
}
