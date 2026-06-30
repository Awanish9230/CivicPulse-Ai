import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

        // Check if admin already exists
        const adminExists = await User.findOne({ email: adminEmail });
        if (adminExists) {
            console.log(`Admin user already exists. Email: ${adminEmail}`);
            process.exit(0);
        }

        const adminUser = new User({
            name: 'Super Admin',
            email: adminEmail,
            password: adminPassword,
            role: 'Admin',
            anonymousId: 'SA-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        });

        await adminUser.save();
        console.log("Admin user created successfully!");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

seedAdmin();
