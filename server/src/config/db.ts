import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        const conn = await mongoose.connect(uri);
        logger.info(`Connected to MongoDB ${conn.connection.host}`);
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;
