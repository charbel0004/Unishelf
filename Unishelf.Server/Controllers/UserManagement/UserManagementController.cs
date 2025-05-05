using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unishelf.Models;
using Unishelf.Server.Data;
using Unishelf.Server.Services.Users;


namespace Unishelf.Server.Controllers.UserManagement
{       
    
    [ApiController]
    [Route("api/[controller]")]
    public class UserManagementController : Controller
    {
        
        
            private readonly UserService _userServices;
            private readonly ApplicationDbContext _dbContext;
            private readonly EncryptionHelper _encryptionHelper;

            public UserManagementController(EncryptionHelper encryptionHelper, ApplicationDbContext dbContext, UserService userService)
            {
                _encryptionHelper = encryptionHelper;
                _dbContext = dbContext;
                _userServices = userService;
            }

        [HttpGet("GetUsers")]
        public async Task<IActionResult> GetUserFields()
        {
            var users = await _userServices.GetAllUsersAsync(); // use a service method returning List<User>

            var encryptedResult = users.Select(user => new
            {
                encryptedUserID = _encryptionHelper.Encrypt(user.UserID.ToString()),
                user.UserName,
                user.FirstName,
                user.LastName,
                user.EmailAddress,
                user.IsCustomer,
                user.IsEmployee,
                user.IsManager,
                user.Active
            });

            return Ok(encryptedResult);
        }

        [HttpPost("UpdateUserField")]
        public async Task<IActionResult> UpdateUserField(
[FromQuery] string encryptedUserId,
[FromQuery] string fieldName,
[FromQuery] bool value)
        {
            if (string.IsNullOrWhiteSpace(encryptedUserId) || string.IsNullOrWhiteSpace(fieldName))
                return BadRequest("Missing parameters.");

            var result = await _userServices.UpdateUserFieldAsync(encryptedUserId, fieldName, value);

            return result
                ? Ok(new { message = "Field updated successfully." })
                : BadRequest("Failed to update field. Invalid user or field name.");
        }




    }
}
