using System.Threading.Tasks;
using System.Collections.Generic;

namespace Unishelf.Server.Services.Users
{
    public interface IUserService
    {
        Task<bool> SignUp(string firstName, string lastName, string username, string email, string phoneNumber, string password);
        Task<(bool success, string token, string message)> Login(string usernameOrEmail, string password);
        Task<List<dynamic>> GetAllUsers();
        Task<bool> UpdateUserFieldAsync(string encryptedUserId, string fieldName, bool value);


    }
}
