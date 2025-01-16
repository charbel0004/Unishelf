using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace Unishelf.Server.Services
{
    public class PasswordHasher
    {
        private const int HashIterations = 100000;

        public byte[] HashPassword(string password)
        {
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            byte[] hashedPassword = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: HashIterations,
                numBytesRequested: 256 / 8
            );

            return Combine(salt, hashedPassword);
        }

        public bool VerifyPassword(string password, byte[] storedHashedPassword)
        {
            byte[] salt = new byte[16];
            Array.Copy(storedHashedPassword, 0, salt, 0, 16);

            byte[] hashedPassword = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: HashIterations,
                numBytesRequested: 256 / 8
            );

            return storedHashedPassword.AsSpan(16).SequenceEqual(hashedPassword);
        }

        private byte[] Combine(byte[] salt, byte[] hashedPassword)
        {
            byte[] result = new byte[salt.Length + hashedPassword.Length];
            Buffer.BlockCopy(salt, 0, result, 0, salt.Length);
            Buffer.BlockCopy(hashedPassword, 0, result, salt.Length, hashedPassword.Length);
            return result;
        }
    }
}
