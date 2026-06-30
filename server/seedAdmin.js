import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@admin.com' });
        if (adminExists) {
            console.log("Admin user already exists. Email: admin@admin.com");
            process.exit(0);
        }

        const adminUser = new User({
            name: 'Super Admin',
            email: 'admin@admin.com',
            password: 'password123',
            role: 'Admin',
            anonymousId: 'SA-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        });

        await adminUser.save();
        console.log("Admin user created successfully!");
        console.log("Email: admin@admin.com");
        console.log("Password: password123");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

seedAdmin();
