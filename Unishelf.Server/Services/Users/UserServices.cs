using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Unishelf.Server.Data;
using Unishelf.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Unishelf.Server.Services.Users
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly PasswordHasher _passwordHasher;
        private readonly IConfiguration _configuration;

       
            
        


        public UserService(ApplicationDbContext dbContext, PasswordHasher passwordHasher, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
        }

        public async Task<bool> SignUp(string firstName, string lastName, string username, string email, string phoneNumber, string password)
        {
            byte[] hashedPassword = _passwordHasher.HashPassword(password);
            var user = new User
            {
                UserName = username,
                FirstName = firstName,
                LastName = lastName,
                PhoneNumber = phoneNumber,
                EmailAddress = email,
                Password = hashedPassword,
                LastLogIn = DateTime.Now
            };

            _dbContext.User.Add(user);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<(bool success, string token, string message)> Login(string usernameOrEmail, string password)
        {
            var user = await _dbContext.User
                .Where(u => u.UserName == usernameOrEmail || u.EmailAddress == usernameOrEmail)
                .Select(u => new
                {
                    u.UserID,
                    u.UserName,
                    Name = u.FirstName + " " + u.LastName,
                    u.EmailAddress,
                    u.PhoneNumber,
                    u.Password, // Assuming this is VARBINARY
                    u.IsCustomer,
                    u.IsEmployee,
                    u.IsManager
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return (false, null, "Invalid username or email.");
            }

            // Verify password (assuming stored as a byte array)
            if (!_passwordHasher.VerifyPassword(password, user.Password))
            {
                return (false, null, "Invalid password.");
            }

            // Update last login timestamp
            var dbUser = await _dbContext.User.FindAsync(user.UserID);
            dbUser.LastLogIn = DateTime.Now;
            await _dbContext.SaveChangesAsync();

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return (true, token, "Login successful!");
        }


        private string GenerateJwtToken(dynamic user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
        new Claim("UserID", user.UserID.ToString()),
        new Claim(ClaimTypes.Name, user.UserName),
        new Claim(ClaimTypes.GivenName, user.Name),
        new Claim(ClaimTypes.Email, user.EmailAddress),
        new Claim("PhoneNumber", user.PhoneNumber),
        new Claim("Role_Customer", user.IsCustomer.ToString()),
        new Claim("Role_Employee", user.IsEmployee.ToString()),
        new Claim("Role_Manager", user.IsManager.ToString())
    };

            var token = new JwtSecurityToken(
                issuer: "YourIssuer",
                audience: "YourAudience",
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        public async Task<List<string>> GetUserNames()
        {
            return await _dbContext.User.Select(u => u.UserName).ToListAsync();
        }
    }
}