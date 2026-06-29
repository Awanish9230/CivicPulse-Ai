import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedOfficer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingOfficer = await User.findOne({ email: 'officer@city.gov' });
        if (existingOfficer) {
            console.log('Officer already exists!');
            process.exit(0);
        }

        await User.create({
            email: 'officer@city.gov',
            password: 'password123',
            name: 'Chief Officer',
            role: 'Admin',
            authorityLevel: 'HOD',
            department: 'Master Admin',
            anonymousId: User.generateAnonymousId()
        });

        console.log('Successfully created officer@city.gov with password "password123"');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding officer:', error);
        process.exit(1);
    }
};

seedOfficer();
