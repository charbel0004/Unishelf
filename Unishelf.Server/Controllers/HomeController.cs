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

namespace Unishelf.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly PasswordHasher _passwordHasher;
        private readonly ApplicationDbContext _dbContext;

        public HomeController(PasswordHasher passwordHasher, ApplicationDbContext dbContext)
        {
            _passwordHasher = passwordHasher;
            _dbContext = dbContext;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] JsonElement data)
        {
            try
            {
                // Extract form data from the JsonElement
                string firstName = data.GetProperty("firstName").GetString();
                string lastName = data.GetProperty("lastName").GetString();
                string username = data.GetProperty("username").GetString();
                string email = data.GetProperty("email").GetString();
                string phoneNumber = data.GetProperty("phoneNumber").GetString();
                string password = data.GetProperty("password").GetString();

                DateTime lastLogIn = DateTime.Now;

                // Hash the password and get it as byte[] using your password hasher
                byte[] hashedPassword = _passwordHasher.HashPassword(password);

                // Establish a connection to the database using _dbContext
                using (var connection = new SqlConnection(_dbContext.Database.GetConnectionString()))
                {
                    await connection.OpenAsync(); // Open the connection

                    // Create a command to execute the stored procedure
                    using (SqlCommand command = new SqlCommand("UN_InsertUser", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        // Add parameters to the command
                        command.Parameters.AddWithValue("@UserName", username);
                        command.Parameters.AddWithValue("@FirstName", firstName);
                        command.Parameters.AddWithValue("@LastName", lastName);
                        command.Parameters.AddWithValue("@PhoneNumber", phoneNumber);
                        command.Parameters.AddWithValue("@EmailAddress", email);
                        command.Parameters.Add("@Password", SqlDbType.VarBinary).Value = hashedPassword; // Pass byte[] here
                        command.Parameters.AddWithValue("@LastLogIn", lastLogIn);

                        try
                        {
                            // Execute the stored procedure directly
                            await command.ExecuteNonQueryAsync();
                            return Ok(new { message = "User created successfully!" });
                        }
                        catch (SqlException sqlEx)
                        {
                            // Specific SQL exception handling
                            return StatusCode(500, new { message = "User creation failed due to a database error.", details = sqlEx.Message });
                        }
                        catch (Exception ex)
                        {
                            // General exception handling
                            return StatusCode(500, new { message = "User creation failed.", details = ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Handle unexpected errors and return a response
                return StatusCode(500, new { message = "An error occurred", details = ex.Message });
            }
        }



        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] JsonElement data)
        {
            try
            {
                // Parse request data
                string usernameOrEmail = data.GetProperty("usernameOrEmail").GetString();
                string password = data.GetProperty("password").GetString();

                using (var connection = new SqlConnection(_dbContext.Database.GetConnectionString()))
                {
                    await connection.OpenAsync();

                    using (SqlCommand command = new SqlCommand("UN_ValidateUser", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@UserNameOrEmail", usernameOrEmail);

                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                // Map database columns
                                byte[] storedPassword = reader["Password"] as byte[]; // VARBINARY
                                string name = reader["Name"].ToString();
                                string email = reader["EmailAddress"].ToString();
                                string phoneNumber = reader["PhoneNumber"].ToString();
                                string userName = reader["UserName"].ToString();
                                bool isCustomer = Convert.ToBoolean(reader["IsCustomer"]);
                                bool isEmployee = Convert.ToBoolean(reader["IsEmployee"]);
                                bool isManager = Convert.ToBoolean(reader["IsManager"]);

                                // Verify password
                                if (!_passwordHasher.VerifyPassword(password, storedPassword))
                                {
                                    return Unauthorized(new { message = "Invalid password." });
                                }

                                // Close the reader before executing another command
                                reader.Close();

                                // Update last login
                                using (var updateCommand = new SqlCommand("UN_UpdateLogIN", connection))
                                {
                                    updateCommand.CommandType = CommandType.StoredProcedure;
                                    updateCommand.Parameters.AddWithValue("@LastLogIn", DateTime.Now);
                                    updateCommand.Parameters.AddWithValue("@UserNameOrEmail", usernameOrEmail);
                                    await updateCommand.ExecuteNonQueryAsync();
                                }

                                // Generate JWT token
                                var keyBytes = RandomNumberGenerator.GetBytes(32); // Generate a secure 256-bit (32-byte) key
                                var key = new SymmetricSecurityKey(keyBytes);

                                var claims = new[]
                                {
                            new Claim(ClaimTypes.Name, userName),
                            new Claim(ClaimTypes.GivenName, name),
                            new Claim(ClaimTypes.Email, email),
                            new Claim("PhoneNumber", phoneNumber),
                            new Claim("Role_Customer", isCustomer.ToString()),
                            new Claim("Role_Employee", isEmployee.ToString()),
                            new Claim("Role_Manager", isManager.ToString())
                        };

                                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
                                var token = new JwtSecurityToken(
                                    issuer: "YourIssuer",
                                    audience: "YourAudience",
                                    claims: claims,
                                    expires: DateTime.Now.AddHours(1),
                                    signingCredentials: creds
                                );

                                return Ok(new
                                {
                                    message = "Login successful!",
                                    token = new JwtSecurityTokenHandler().WriteToken(token)
                                });
                            }
                            else
                            {
                                return Unauthorized(new { message = "Invalid username or email." });
                            }
                        }
                    }
                }
            }
            catch (SqlException sqlEx)
            {
                return StatusCode(500, new { message = "Database error occurred.", details = sqlEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", details = ex.Message });
            }
        }



    }
}
