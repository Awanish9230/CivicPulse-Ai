export const welcomeEmailTemplate = (name, role) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CivicPulse AI</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; color: white; }
        .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
        .content { padding: 40px; }
        h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 0; }
        .role-badge { display: inline-block; padding: 6px 12px; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
        .features { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0; }
        .features h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; }
        .features ul { padding-left: 20px; margin-bottom: 0; }
        .features li { margin-bottom: 8px; }
        .features li:last-child { margin-bottom: 0; }
        .security-notice { font-size: 14px; color: #64748b; background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 32px; }
        .footer { text-align: center; padding: 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 14px; }
        .support-link { color: #4f46e5; text-decoration: none; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">CivicPulse AI</h1>
            <p style="margin-top: 8px; opacity: 0.9;">Empowering Smart Communities</p>
        </div>
        <div class="content">
            <h1>Welcome aboard, ${name || 'Citizen'}! 🎉</h1>
            <div class="role-badge">Account Type: ${role}</div>
            
            <p>We are thrilled to have you join CivicPulse AI. Our platform is designed to bridge the gap between citizens and authorities, using artificial intelligence to solve urban issues faster and smarter.</p>
            
            <div class="features">
                <h3>What you can do with CivicPulse AI:</h3>
                <ul>
                    <li><strong>Anonymous Reporting:</strong> Report issues safely without exposing your identity.</li>
                    <li><strong>Real-Time Tracking:</strong> Follow the progress of your community reports instantly.</li>
                    <li><strong>Direct Communication:</strong> Collaborate seamlessly with assigned authorities.</li>
                    <li><strong>Smart Dashboard:</strong> Get personalized AI-driven insights on your locality.</li>
                </ul>
            </div>
            
            <p>If you have any questions or need assistance getting started, our team is always here to help.</p>
            
            <div class="security-notice">
                <strong>Security Notice:</strong> We will never ask for your password via email. If you ever receive a suspicious request, please contact our support team immediately.
            </div>
            
            <p style="margin-top: 32px;">
                Best regards,<br>
                <strong>The CivicPulse AI Team</strong>
            </p>
        </div>
        <div class="footer">
            Need help? Contact us at <a href="mailto:support@civicpulse.com" class="support-link">support@civicpulse.com</a><br>
            &copy; ${new Date().getFullYear()} CivicPulse AI. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export const passwordResetTemplate = (resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #0f172a; padding: 32px 20px; text-align: center; color: white; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
        .content { padding: 40px; text-align: center; }
        h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
        .btn { display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 32px 0; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3); transition: transform 0.2s; }
        .expiry-notice { display: inline-block; padding: 8px 16px; background: #fef3c7; color: #b45309; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
        .security-warning { font-size: 14px; color: #64748b; background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 32px; text-align: left; }
        .footer { text-align: center; padding: 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">CivicPulse AI</h1>
        </div>
        <div class="content">
            <h1>Reset Your Password</h1>
            <p>We received a request to reset the password for your CivicPulse AI account. Click the button below to choose a new password.</p>
            
            <a href="${resetUrl}" class="btn" style="color: #ffffff; text-decoration: none;">Reset Password</a>
            
            <div>
                <div class="expiry-notice">⏱️ This link will expire in 15 minutes</div>
            </div>
            
            <div class="security-warning">
                <strong>Didn't request this?</strong><br>
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
            </div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} CivicPulse AI. All rights reserved.
        </div>
    </div>
</body>
</html>
`;
