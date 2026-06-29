import mongoose from 'mongoose';
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Since this is for Anonymous Citizens, we don't store email/name
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase:true,
        trim:true
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
    role: {
        type: String,
        enum: ['Citizen', 'Authority', 'Admin'],
        default: 'Citizen',
    },
    name: {
        type: String,
        trim: true,
    },
    authorityLevel: {
        type: String,
        enum: ['Junior', 'Senior', 'HOD'],
    },
    department: {
        type: String,
        trim: true,
    },
    // anonymousIdLastRotated: {
    //     type: Date,
    //     default: Date.now
    // },
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

// password encryption using bcryptjs

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return ;

    this.password = await bcrypt.hash(this.password, 10);
    
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

// generating access token and refresh token
userSchema.methods.generateAccessToken = function () {    
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        }
    )

}
// generates random anonymous id for each user
userSchema.statics.generateAnonymousId = function () {           //used by User not "user"
    return `CP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

 const User = mongoose.model('User', userSchema);

 export default User;
