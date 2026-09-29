
import { welcomeEmailTemplate, passwordResetTemplate } from '../utils/emailTemplates.js';

export const sendEmail = async (options) => {
    try {
        const apiKey = process.env.BREVO_API_KEY;
        
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
    }
};

export const sendWelcomeEmail = async (email, name, role) => {
    const html = welcomeEmailTemplate(name, role);
    await sendEmail({
        email,
        subject: 'Welcome to CivicPulse AI 🎉',
        html
    });
};

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
