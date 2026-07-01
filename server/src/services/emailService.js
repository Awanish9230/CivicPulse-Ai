import transporter from '../config/email.js';
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
        const message = {
            from: `${process.env.EMAIL_FROM_NAME || 'CivicPulse AI'} <${process.env.EMAIL_FROM || 'noreply@civicpulse.com'}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(message);
        console.log(`Message sent: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
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
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const html = passwordResetTemplate(resetUrl);
    await sendEmail({
        email,
        subject: 'Password Reset Request - CivicPulse AI',
        html
    });
};
