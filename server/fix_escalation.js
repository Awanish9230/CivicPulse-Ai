import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './src/models/Complaint.js';

dotenv.config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const result = await Complaint.collection.updateMany(
            { escalationLevel: { $nin: ['Junior', 'Senior', 'HOD'] } },
            { $set: { escalationLevel: 'Junior' } }
        );
        console.log('Fixed:', result);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fix();
