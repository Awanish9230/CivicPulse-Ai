export const welcomeEmailTemplate = (name, role) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CivicPulse</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaec; border-radius: 8px; border-collapse: collapse;">
        <tr>
            <td style="padding: 32px; border-bottom: 1px solid #eaeaec;">
                <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.5px;">CivicPulse</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Welcome, ${name || 'Citizen'}.</h2>
                <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0;">We are glad to have you on board. CivicPulse is designed to streamline community issue reporting and resolution.</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 16px;">
                            <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Account Role</p>
                            <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 600;">${role}</p>
                        </td>
                    </tr>
                </table>

                <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px 0;">As a member, you can now:</p>
                <ul style="font-size: 15px; color: #4b5563; margin: 0 0 32px 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Submit and track infrastructure issues in real-time.</li>
                    <li style="margin-bottom: 8px;">Collaborate directly with assigned municipal authorities.</li>
                    <li style="margin-bottom: 8px;">Access the dashboard for status updates.</li>
                </ul>
                
                <p style="font-size: 15px; color: #4b5563; margin: 0 0 32px 0;">If you run into any issues or have questions, please reach out to our support team.</p>
                
                <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 500;">— The CivicPulse Team</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #eaeaec; border-radius: 0 0 8px 8px;">
                <p style="font-size: 12px; color: #6b7280; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaec; border-radius: 8px; border-collapse: collapse;">
        <tr>
            <td style="padding: 32px; border-bottom: 1px solid #eaeaec;">
                <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.5px;">CivicPulse</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px;">
                <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Reset your password</h2>
                <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0;">We received a request to reset the password for your CivicPulse account. You can reset your password by clicking the button below.</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                    <tr>
                        <td>
                            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500;">Reset Password</a>
                        </td>
                    </tr>
                </table>
                
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">This link will expire in 15 minutes.</p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0;">If you did not request a password reset, you can safely ignore this email.</p>
                
                <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 500;">— The CivicPulse Team</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #eaeaec; border-radius: 0 0 8px 8px;">
                <p style="font-size: 12px; color: #6b7280; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
