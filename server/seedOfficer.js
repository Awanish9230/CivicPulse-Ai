import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedOfficer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const officerEmail = process.env.OFFICER_EMAIL || 'officer@city.gov';
        const officerPassword = process.env.OFFICER_PASSWORD || 'password123';

        const existingOfficer = await User.findOne({ email: officerEmail });
        if (existingOfficer) {
            console.log(`Officer already exists! Email: ${officerEmail}`);
            process.exit(0);
        }

        await User.create({
            email: officerEmail,
            password: officerPassword,
            name: 'Chief Officer',
            role: 'Admin',
            authorityLevel: 'HOD',
            department: 'Master Admin',
            anonymousId: User.generateAnonymousId()
        });

        console.log(`Successfully created ${officerEmail} with password "${officerPassword}"`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding officer:', error);
        process.exit(1);
    }
};

seedOfficer();
