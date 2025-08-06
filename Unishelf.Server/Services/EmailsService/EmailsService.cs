using System;
using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Unishelf.Server.Services
{
    public class EmailService
    {
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _senderEmail;
        private readonly string _senderPassword;
        private readonly bool _enableSsl;

        public EmailService(string smtpHost, int smtpPort, string senderEmail, string senderPassword, bool enableSsl)
        {
            _smtpHost = smtpHost;
            _smtpPort = smtpPort;
            _senderEmail = senderEmail;
            _senderPassword = senderPassword;
            _enableSsl = enableSsl;
        }

        public async Task SendEmailAsync(string recipientEmail, string subject, string body, bool isHtml = false)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail))
                throw new ArgumentNullException(nameof(recipientEmail), "Recipient email cannot be null or empty.");

            if (!IsValidEmail(recipientEmail))
                throw new ArgumentException("Recipient email address is not in a valid format.", nameof(recipientEmail));

            if (string.IsNullOrWhiteSpace(subject))
                throw new ArgumentNullException(nameof(subject), "Email subject cannot be null or empty.");

            if (string.IsNullOrWhiteSpace(body))
                throw new ArgumentNullException(nameof(body), "Email body cannot be null or empty.");

            try
            {
                using (var smtpClient = new SmtpClient(_smtpHost, _smtpPort))
                using (var mailMessage = new MailMessage())
                {
                    smtpClient.EnableSsl = _enableSsl;
                    smtpClient.Credentials = new NetworkCredential(_senderEmail, _senderPassword);

                    mailMessage.From = new MailAddress(_senderEmail);
                    mailMessage.To.Add(recipientEmail);
                    mailMessage.Subject = subject;
                    mailMessage.Body = body;
                    mailMessage.IsBodyHtml = isHtml;

                    await smtpClient.SendMailAsync(mailMessage);
                }
            }
            catch (SmtpException ex)
            {
                throw new Exception($"Failed to send email to {recipientEmail}: SMTP error - {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to send email to {recipientEmail}: {ex.Message}", ex);
            }
        }

        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            const string emailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
            return Regex.IsMatch(email, emailPattern, RegexOptions.IgnoreCase);
        }
    }
}
