import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        let conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;