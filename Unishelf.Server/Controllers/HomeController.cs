    using Unishelf.Server.Services;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Data.SqlClient;
    using Microsoft.EntityFrameworkCore;
    using System.Data;
    using System.Threading.Tasks;
    using Unishelf.Server.Data;
    using System.Text.Json;
    using Microsoft.IdentityModel.Tokens;
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Text;
    using System.Security.Cryptography;
using Unishelf.Server.Services.Users;

namespace Unishelf.Server.Controllers
    {
        [ApiController]
        [Route("api/[controller]")]
        public class HomeController : ControllerBase
        {
            private readonly PasswordHasher _passwordHasher;
            private readonly ApplicationDbContext _dbContext;
            private readonly UserService _userService;

            public HomeController(PasswordHasher passwordHasher, ApplicationDbContext dbContext, UserService userService)
            {
                _passwordHasher = passwordHasher;
                _dbContext = dbContext;
                _userService = userService;
            }

            [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] JsonElement data)
        {
            try
            {
                string firstName = data.GetProperty("firstName").GetString();
                string lastName = data.GetProperty("lastName").GetString();
                string username = data.GetProperty("username").GetString();
                string email = data.GetProperty("email").GetString();
                string phoneNumber = data.GetProperty("phoneNumber").GetString();
                string password = data.GetProperty("password").GetString();

                bool result = await _userService.SignUp(firstName, lastName, username, email, phoneNumber, password);

                if (result)
                {
                    return Ok(new { message = "User created successfully!" });
                }

                return BadRequest(new { message = "User creation failed." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", details = ex.Message });
            }
        
            }



            [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] JsonElement data)
        {
            try
            {
                // Validate request data
                if (!data.TryGetProperty("usernameOrEmail", out JsonElement usernameOrEmailElement) ||
                    !data.TryGetProperty("password", out JsonElement passwordElement))
                {
                    return BadRequest(new { message = "Username/Email and password are required." });
                }

                string usernameOrEmail = usernameOrEmailElement.GetString();
                string password = passwordElement.GetString();

                // Call the UserService to validate user and generate a JWT token
                var (success, token, message) = await _userService.Login(usernameOrEmail, password);

                if (!success)
                {
                    return Unauthorized(new { message });
                }

                return Ok(new { token, message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", details = ex.Message });
            }
        }


        [HttpGet("UN_GetUsernames")]
            public async Task<IActionResult> GetActiveUserNames()
            {
                try
                {
                    List<string> userNames = await _userService.GetUserNames();
                    return Ok(userNames);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "Unexpected error", details = ex.Message });
                }

            /*try
            {
                using (var connection = new SqlConnection(_dbContext.Database.GetConnectionString()))
                {
                    connection.Open();

                    using (var command = new SqlCommand("[dbo].[UN_GetUserNames]", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        using (var reader = command.ExecuteReader())
                        {
                            var userNames = new List<string>();

                            while (reader.Read())
                            {
                                userNames.Add(reader["UserName"].ToString());
                            }

                            return Ok(userNames);
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "Database error", details = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Unexpected error", details = ex.Message });
            }*/
        }

        }
    }
