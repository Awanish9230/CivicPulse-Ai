import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_HOST || 'smtp-relay.brevo.com',
    port: process.env.BREVO_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
});

async function testEmail() {
    try {
        const message = {
            from: `CivicPulse AI <${process.env.EMAIL_FROM}>`,
            to: 'test@example.com', // Replace with a test address if needed, or just let it fail to see the error
            subject: 'Test Email',
            html: '<p>Test</p>',
        };

        const info = await transporter.sendMail(message);
        console.log(`Message sent: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testEmail();
