
import { welcomeEmailTemplate, passwordResetTemplate } from '../utils/emailTemplates.js';

/**
 * Send a generic email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 */
export const sendEmail = async (options) => {
    try {
        const apiKey = process.env.BREVO_API_KEY;
        
        // If no API key is provided, log a warning and return (useful for local dev without key)
        if (!apiKey) {
            console.warn('BREVO_API_KEY is not set. Email was not sent.');
            return;
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.EMAIL_FROM_NAME || 'CivicPulse AI',
                    email: process.env.EMAIL_FROM || 'noreply@civicpulse.com'
                },
                to: [
                    {
                        email: options.email
                    }
                ],
                subject: options.subject,
                htmlContent: options.html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Brevo API Error:', data);
        } else {
            console.log(`Email sent successfully to ${options.email} via Brevo HTTP API!`);
        }
    } catch (error) {
        console.error('Error sending email via Brevo HTTP API:', error);
        // Do not throw to prevent blocking the main thread (e.g. registration success)
    }
};

/**
 * Send welcome email to new users
 * @param {string} email - Recipient email
 * @param {string} name - User's name (optional)
 * @param {string} role - User's role
 */
export const sendWelcomeEmail = async (email, name, role) => {
    const html = welcomeEmailTemplate(name, role);
    await sendEmail({
        email,
        subject: 'Welcome to CivicPulse AI 🎉',
        html
    });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - The raw reset token
 */
export const sendPasswordResetEmail = async (email, resetToken, role = 'Citizen') => {
    const roleParam = role.toLowerCase();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}?role=${roleParam}`;
    const html = passwordResetTemplate(resetUrl);
    await sendEmail({
        email,
        subject: 'Password Reset Request - CivicPulse AI',
        html
    });
};
