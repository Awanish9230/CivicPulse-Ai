import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import User from './src/modules/user/user.model.js'; // Adjust path based on execution dir

dotenv.config();

const DEPARTMENTS = [
    'Public Works',
    'Water & Sanitation',
    'Power',
    'Traffic & Safety',
    'Animal Control',
    'General Administration'
];

const getDeptSlug = (deptName) => {
    return deptName.toLowerCase().replace(/ & /g, '').replace(/ /g, '');
};

const seedMembers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Step 1: Fix any existing incorrect department names
        console.log('Fixing existing incorrect departments...');
        await User.updateMany({ department: 'Electricity' }, { $set: { department: 'Power' } });
        await User.updateMany({ department: 'Roads' }, { $set: { department: 'Public Works' } });
        await User.updateMany({ department: 'Water' }, { $set: { department: 'Water & Sanitation' } });
        await User.updateMany({ department: 'Sanitation' }, { $set: { department: 'Water & Sanitation' } });
        await User.updateMany({ department: 'Police' }, { $set: { department: 'Traffic & Safety' } });

        // Step 2: Seed new members
        for (const dept of DEPARTMENTS) {
            console.log(`Seeding members for department: ${dept}...`);
            const slug = getDeptSlug(dept);

            const membersToCreate = [];

            // 1 HOD
            membersToCreate.push({
                email: `hod.${slug}@gmail.com`,
                name: `HOD ${dept}`,
                authorityLevel: 'HOD',
                department: dept
            });

            // 4 Seniors
            for (let i = 1; i <= 4; i++) {
                membersToCreate.push({
                    email: `senior${i}.${slug}@gmail.com`,
                    name: `Senior ${i} ${dept}`,
                    authorityLevel: 'Senior',
                    department: dept
                });
            }

            // 10 Juniors
            for (let i = 1; i <= 10; i++) {
                membersToCreate.push({
                    email: `junior${i}.${slug}@gmail.com`,
                    name: `Junior ${i} ${dept}`,
                    authorityLevel: 'Junior',
                    department: dept
                });
            }

            for (const member of membersToCreate) {
                // Check if exists
                const existing = await User.findOne({ email: member.email });
                if (!existing) {
                    const anonymousId = User.generateAnonymousId();
                    const newUser = new User({
                        ...member,
                        password: 'password123',
                        role: 'Authority',
                        anonymousId
                    });
                    await newUser.save();
                    console.log(`Created: ${member.email}`);
                } else {
                    console.log(`Skipped existing: ${member.email}`);
                }
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding members:', error);
        process.exit(1);
    }
};

seedMembers();
