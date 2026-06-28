import mongoose from 'mongoose';

// Since this is for Anonymous Citizens, we don't store email/name
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    anonymousId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // The device token is used to maintain session persistence and push notifications
    deviceToken: {
        type: String,
    },
    // Refresh token for JWT auth
    refreshToken: {
        type: String,
    },
    // Strike system for toxicity/abuse in Community Portal
    strikes: {
        type: Number,
        default: 0,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banUntil: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);
export default User;
