import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const departments = [
    { name: 'Public Works', prefix: 'pw' },
    { name: 'Water & Sanitation', prefix: 'water' },
    { name: 'Power', prefix: 'power' },
    { name: 'Traffic & Safety', prefix: 'traffic' },
    { name: 'Animal Control', prefix: 'animal' },
    { name: 'General Administration', prefix: 'general' }
];

const seedAuthorities = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const defaultPassword = 'password123';

        // Helper to format names
        const formatName = (level, deptName, index = '') => {
            if (level === 'HOD') return `Chief of ${deptName}`;
            return `${level} Officer ${index} - ${deptName}`;
        };

        const authoritiesToInsert = [];

        for (const dept of departments) {
            // 1 HOD
            authoritiesToInsert.push({
                email: `chief_${dept.prefix}@city.gov`,
                password: defaultPassword,
                name: formatName('HOD', dept.name),
                role: 'Authority',
                authorityLevel: 'HOD',
                department: dept.name,
                anonymousId: User.generateAnonymousId()
            });

            // 2 Seniors
            for (let i = 1; i <= 2; i++) {
                authoritiesToInsert.push({
                    email: `senior${i}_${dept.prefix}@city.gov`,
                    password: defaultPassword,
                    name: formatName('Senior', dept.name, i),
                    role: 'Authority',
                    authorityLevel: 'Senior',
                    department: dept.name,
                    anonymousId: User.generateAnonymousId()
                });
            }

            // 4 Juniors
            for (let i = 1; i <= 4; i++) {
                authoritiesToInsert.push({
                    email: `junior${i}_${dept.prefix}@city.gov`,
                    password: defaultPassword,
                    name: formatName('Junior', dept.name, i),
                    role: 'Authority',
                    authorityLevel: 'Junior',
                    department: dept.name,
                    anonymousId: User.generateAnonymousId()
                });
            }
        }

        // Delete existing seeded authorities based on the prefix pattern to avoid duplicates
        const emailsToDelete = authoritiesToInsert.map(a => a.email);
        await User.deleteMany({ email: { $in: emailsToDelete } });
        console.log(`Deleted existing seeded authorities`);

        // Insert new authorities
        // Note: because of the pre-save hook for password hashing in User model,
        // we should create them one by one or use User.create which triggers hooks.
        for (const auth of authoritiesToInsert) {
            await User.create(auth);
            console.log(`Created: ${auth.name} (${auth.email})`);
        }

        console.log('\n✅ Successfully seeded all departments with 7 members each!');
        console.log('Default Password for all: password123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding authorities:', error);
        process.exit(1);
    }
};

seedAuthorities();
