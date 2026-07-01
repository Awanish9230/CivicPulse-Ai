import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        let conn = await mongoose.connect(process.env.MONGODB_URI);
        logger.info(`Connected to MongoDB ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Connected to MongoDB ${conn.connection.host}`);
        process.exit(1);
    }
}

export default connectDB;