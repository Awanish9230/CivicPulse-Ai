import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node to prioritize IPv4 over IPv6. This fixes the 'ENETUNREACH' error 
// on Render and other cloud platforms that do not route outbound IPv6 traffic natively.
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export default transporter;
