using Microsoft.AspNetCore.DataProtection;
using System.Security.Cryptography;

public class EncryptionHelper
{
    private readonly IDataProtector _protector;

    public EncryptionHelper(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("EncryptionHelper");
    }

    public string Encrypt(string input)
    {
        var encrypted = _protector.Protect(input);
        return Uri.EscapeDataString(encrypted); // Ensure URL safe
    }

    public string Decrypt(string encryptedText)
    {
        try
        {
            var decoded = Uri.UnescapeDataString(encryptedText);
            return _protector.Unprotect(decoded);
        }
        catch (Exception ex)
        {
            // Handle exception
            throw new CryptographicException("An error occurred during a cryptographic operation.", ex);
        }
    }
}
