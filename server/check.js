import mongoose from 'mongoose';
import User from './src/modules/user/user.model.js';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/civicpulse');
    const counts = await User.aggregate([
        { $match: { role: 'Authority' } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    console.log(counts);
    process.exit(0);
}
run();
