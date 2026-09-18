export const welcomeEmailTemplate = (name, role) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CivicPulse</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border-collapse: collapse; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);">
        <!-- Top Gradient Border -->
        <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);"></td>
        </tr>
        
        <!-- Header -->
        <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
                <h1 style="font-size: 28px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -1px;">CivicPulse<span style="color: #3b82f6;">.</span></h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 10px 40px 40px 40px;">
                <h2 style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0;">Welcome aboard, ${name || 'Citizen'}! 👋</h2>
                <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.7;">We are thrilled to have you join our community. CivicPulse is designed to empower you to report, track, and resolve infrastructure issues seamlessly.</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 16px 20px;">
                            <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Account Role</p>
                            <p style="font-size: 16px; color: #0f172a; margin: 0; font-weight: 700;">${role}</p>
                        </td>
                    </tr>
                </table>

                <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Here is what you can do next:</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                    <tr>
                        <td style="padding-bottom: 12px;">
                            <p style="font-size: 16px; color: #4b5563; margin: 0;"><strong style="color: #111827;">📍 Report Issues:</strong> Submit infrastructure problems instantly.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 12px;">
                            <p style="font-size: 16px; color: #4b5563; margin: 0;"><strong style="color: #111827;">🔄 Track Progress:</strong> Watch real-time resolution updates.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 12px;">
                            <p style="font-size: 16px; color: #4b5563; margin: 0;"><strong style="color: #111827;">🤝 Collaborate:</strong> Work directly with municipal authorities.</p>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; text-align: center;">
                    <tr>
                        <td>
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">Go to Dashboard &rarr;</a>
                        </td>
                    </tr>
                </table>
                
                <p style="font-size: 15px; color: #64748b; margin: 0;">If you run into any issues, reply to this email. We're here to help.</p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const passwordResetTemplate = (resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border-collapse: collapse; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);">
        <!-- Top Gradient Border -->
        <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #ec4899, #f43f5e, #ef4444);"></td>
        </tr>
        
        <!-- Header -->
        <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
                <h1 style="font-size: 28px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -1px;">CivicPulse<span style="color: #ec4899;">.</span></h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 10px 40px 40px 40px;">
                <h2 style="font-size: 22px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; text-align: center;">Password Reset Request</h2>
                <p style="font-size: 16px; color: #4b5563; margin: 0 0 32px 0; line-height: 1.7; text-align: center;">We received a request to securely reset the password for your CivicPulse account. Click the button below to set a new password.</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; text-align: center;">
                    <tr>
                        <td>
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(225, 29, 72, 0.2);">Reset My Password</a>
                        </td>
                    </tr>
                </table>
                
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="font-size: 14px; color: #991b1b; margin: 0 0 4px 0; font-weight: 600;">Security Notice</p>
                    <p style="font-size: 13px; color: #b91c1c; margin: 0;">This highly secure link will automatically expire in <strong>15 minutes</strong>.</p>
                </div>

                <p style="font-size: 14px; color: #64748b; margin: 0; text-align: center;">If you did not request a password reset, your account is safe and you can safely ignore this email.</p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
