import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './src/modules/user/user.model.js';

const DEPARTMENTS = [
    'Public Works',
    'Water & Sanitation',
    'Power',
    'Traffic & Safety',
    'Animal Control',
    'General Administration'
];

const LEVELS = ['Junior', 'Senior', 'HOD'];

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/civicpulse');
        console.log('Connected to DB');

        const password = 'password123';
        
        for (const dept of DEPARTMENTS) {
            for (const level of LEVELS) {
                const prefix = dept.toLowerCase().split(' ')[0].replace('&', '');
                const email = `${level.toLowerCase()}.${prefix}@civicpulse.com`;
                
                // Check if user exists
                const existing = await User.findOne({ email });
                if (existing) {
                    console.log(`User ${email} already exists, skipping...`);
                    continue;
                }

                const user = new User({
                    email,
                    password,
                    role: 'Authority',
                    name: `${level} ${dept} Official`,
                    anonymousId: User.generateAnonymousId(),
                    authorityLevel: level,
                    department: dept,
                });

                await user.save();
                console.log(`Created ${level} Official for ${dept} -> ${email}`);
            }
        }
        
        // Also ensure an Admin exists
        const adminEmail = 'admin@civicpulse.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const admin = new User({
                email: adminEmail,
                password,
                role: 'Admin',
                name: 'Super Admin',
                anonymousId: User.generateAnonymousId(),
                department: 'Master Admin'
            });
            await admin.save();
            console.log(`Created Super Admin -> ${adminEmail}`);
        } else {
             console.log(`User ${adminEmail} already exists, skipping...`);
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
