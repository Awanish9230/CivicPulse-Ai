import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const user = await User.findOne({ role: 'Authority' });
    console.log('User _id:', user._id, 'Type:', typeof user._id, 'Is ObjectId:', user._id instanceof mongoose.Types.ObjectId);
    
    // Simulate socket logic
    const senderIdStr = user._id.toString();
    const senderObjectId = new mongoose.Types.ObjectId(senderIdStr);
    
    const usersStr = await User.find({ _id: { $ne: senderIdStr } }).select('_id');
    const usersObj = await User.find({ _id: { $ne: senderObjectId } }).select('_id');
    
    console.log('Excluded using String (count):', usersStr.length, 'Contains sender?', usersStr.some(u => u._id.toString() === senderIdStr));
    console.log('Excluded using ObjectId (count):', usersObj.length, 'Contains sender?', usersObj.some(u => u._id.toString() === senderIdStr));
    
    mongoose.disconnect();
}).catch(console.error);
