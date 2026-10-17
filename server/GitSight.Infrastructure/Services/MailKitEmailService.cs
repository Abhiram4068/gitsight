using System;
using System.Threading;
using System.Threading.Tasks;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Configurations;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace GitSight.Infrastructure.Services;

public class MailKitEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<MailKitEmailService> _logger;

    public MailKitEmailService(IOptions<SmtpSettings> options, ILogger<MailKitEmailService> logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Email sending skipped: recipient email address is empty.");
            return;
        }

        if (string.IsNullOrWhiteSpace(_settings.Server))
        {
            _logger.LogWarning("Email sending skipped: SMTP Server is not configured in appsettings. SmtpSettings:Server is empty.");
            return;
        }

        try
        {
            var message = new MimeMessage();
            var senderDisplayName = !string.IsNullOrWhiteSpace(_settings.SenderName) ? _settings.SenderName : "GitSight";
            var senderAddress = !string.IsNullOrWhiteSpace(_settings.SenderEmail) ? _settings.SenderEmail : (_settings.Username ?? "noreply@gitsight.com");
            
            message.From.Add(new MailboxAddress(senderDisplayName, senderAddress));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            // Ignore SSL revocation issues on local/self-signed setups if necessary
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            var socketOptions = _settings.Port == 465
                ? SecureSocketOptions.SslOnConnect
                : (_settings.EnableSsl ? SecureSocketOptions.StartTlsWhenAvailable : SecureSocketOptions.Auto);

            _logger.LogInformation("Connecting to SMTP server {Server}:{Port} for recipient {ToEmail}...", _settings.Server, _settings.Port, toEmail);
            await client.ConnectAsync(_settings.Server, _settings.Port, socketOptions, cancellationToken);

            if (!string.IsNullOrEmpty(_settings.Username) && !string.IsNullOrEmpty(_settings.Password))
            {
                await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Successfully sent email to {ToEmail} with subject '{Subject}'.", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} with subject '{Subject}'. Error: {Message}", toEmail, subject, ex.Message);
            // Non-blocking: we log the error rather than crashing the review workflow
        }
    }

    public Task SendPrReviewStartedEmailAsync(string toEmail, string owner, string repo, int prNumber, CancellationToken cancellationToken = default)
    {
        var subject = $"[GitSight] AI Review Started: {owner}/{repo} #{prNumber}";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #111827; }}
        .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .header {{ background-color: #111827; padding: 20px 24px; text-align: left; }}
        .header h1 {{ margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; }}
        .content {{ padding: 24px; }}
        .status-badge {{ display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600; padding: 4px 10px; margin-bottom: 16px; }}
        .details-box {{ background-color: #f3f4f6; padding: 14px 16px; margin: 16px 0; }}
        .details-row {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }}
        .details-row:last-child {{ margin-bottom: 0; }}
        .label {{ color: #6b7280; }}
        .value {{ color: #111827; font-weight: 500; }}
        .footer {{ border-top: 1px solid #e5e7eb; padding: 16px 24px; font-size: 12px; color: #9ca3af; text-align: center; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>GitSight</h1>
        </div>
        <div class=""content"">
            <span class=""status-badge"">Analysis Started</span>
            <h2 style=""font-size: 18px; margin: 0 0 12px 0;"">AI Code Review in Progress</h2>
            <p style=""font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 16px 0;"">
                GitSight Agent has started analyzing Pull Request <strong>#{prNumber}</strong> in <strong>{owner}/{repo}</strong>.
            </p>
            <div class=""details-box"">
                <div class=""details-row""><span class=""label"">Repository:</span> <span class=""value"">{owner}/{repo}</span></div>
                <div class=""details-row""><span class=""label"">Pull Request:</span> <span class=""value"">#{prNumber}</span></div>
                <div class=""details-row""><span class=""label"">Trigger Time:</span> <span class=""value"">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</span></div>
            </div>
            <p style=""font-size: 13px; color: #6b7280; margin: 0;"">
                You will receive another email as soon as the review completes with a direct link to the insights dashboard.
            </p>
        </div>
        <div class=""footer"">
            &copy; {DateTime.UtcNow.Year} GitSight. Automated AI Review Platform.
        </div>
    </div>
</body>
</html>";

        return SendEmailAsync(toEmail, subject, htmlBody, cancellationToken);
    }

    public Task SendPrReviewCompletedEmailAsync(string toEmail, string owner, string repo, int prNumber, string prInsightUrl, CancellationToken cancellationToken = default)
    {
        var subject = $"[GitSight] AI Review Completed: {owner}/{repo} #{prNumber}";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #111827; }}
        .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .header {{ background-color: #111827; padding: 20px 24px; text-align: left; }}
        .header h1 {{ margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; }}
        .content {{ padding: 24px; }}
        .status-badge {{ display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 12px; font-weight: 600; padding: 4px 10px; margin-bottom: 16px; }}
        .details-box {{ background-color: #f3f4f6; padding: 14px 16px; margin: 16px 0; }}
        .details-row {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }}
        .details-row:last-child {{ margin-bottom: 0; }}
        .label {{ color: #6b7280; }}
        .value {{ color: #111827; font-weight: 500; }}
        .btn {{ display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 600; padding: 12px 24px; text-decoration: none; margin: 20px 0 12px 0; }}
        .footer {{ border-top: 1px solid #e5e7eb; padding: 16px 24px; font-size: 12px; color: #9ca3af; text-align: center; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>GitSight</h1>
        </div>
        <div class=""content"">
            <span class=""status-badge"">Review Ready</span>
            <h2 style=""font-size: 18px; margin: 0 0 12px 0;"">AI Code Review Completed</h2>
            <p style=""font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 16px 0;"">
                The automated AI review for Pull Request <strong>#{prNumber}</strong> in <strong>{owner}/{repo}</strong> is complete. You can view detailed code suggestions, security insights, and metrics on your GitSight dashboard.
            </p>
            <div class=""details-box"">
                <div class=""details-row""><span class=""label"">Repository:</span> <span class=""value"">{owner}/{repo}</span></div>
                <div class=""details-row""><span class=""label"">Pull Request:</span> <span class=""value"">#{prNumber}</span></div>
                <div class=""details-row""><span class=""label"">Completed At:</span> <span class=""value"">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</span></div>
            </div>
            <div style=""text-align: center;"">
                <a href=""{prInsightUrl}"" class=""btn"" target=""_blank"">View PR Insights</a>
            </div>
            <p style=""font-size: 12px; color: #9ca3af; text-align: center; margin-top: 8px;"">
                Direct link: <a href=""{prInsightUrl}"" style=""color: #2563eb; word-break: break-all;"">{prInsightUrl}</a>
            </p>
        </div>
        <div class=""footer"">
            &copy; {DateTime.UtcNow.Year} GitSight. Automated AI Review Platform.
        </div>
    </div>
</body>
</html>";

        return SendEmailAsync(toEmail, subject, htmlBody, cancellationToken);
    }
}
