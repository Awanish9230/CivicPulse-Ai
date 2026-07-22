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
    pastAnonymousIds: {
        type: [String],
        default: [],
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
    pushSubscriptions: {
        type: Array,
        default: []
    },
    authorityLevel: {
        type: String,
        enum: ['Junior', 'Senior', 'ChiefOfficer'],
    },
    department: {
        type: String,
        trim: true,
        enum: ['Public Works', 'Water & Sanitation', 'Power', 'Traffic & Safety', 'Animal Control', 'General Administration', 'Master Admin'],
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
    points: {
        type: Number,
        default: 0,
    },
    badges: {
        type: [String],
        default: [],
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banUntil: {
        type: Date,
        default: null,
    },
    restrictedFeatures: {
        type: [String],
        default: [],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
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
userSchema.methods.generateAccessToken = function (plainAnonymousId, plainPastIds = []) {    
    return jwt.sign(
        {
            _id: this._id,
            anonymousId: plainAnonymousId || this.anonymousId, // Fallback if plain isn't provided
            pastAnonymousIds: plainPastIds
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

userSchema.methods.generatePasswordResetToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire to 15 minutes
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken; // Return the unhashed token for the email
};

// generates random anonymous id for each user
userSchema.statics.generateAnonymousId = function () {
    return `CP-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
};

const keyCache = new Map();

function getDerivedKey(secret, isGlobalSecret = false) {
    if (isGlobalSecret) {
        if (!keyCache.has(secret)) {
            keyCache.set(secret, crypto.scryptSync(secret, 'civicpulse_salt_2026', 32));
        }
        return keyCache.get(secret);
    }
    // Do not cache user passwords to prevent memory exhaustion (DoS) attacks
    return crypto.scryptSync(secret, 'civicpulse_salt_2026', 32);
}

// Encrypt Identity using Global Secret
userSchema.statics.encryptIdentity = function(plaintext) {
    if (!plaintext) return null;
    const globalSecret = process.env.ACCESS_TOKEN_SECRET || 'civicpulse_global_fallback_secret_2026';
    const key = getDerivedKey(globalSecret, true);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// Decrypt Identity using Global Secret (with fallback to password for legacy compatibility)
userSchema.statics.decryptIdentity = function(ciphertext, password) {
    if (!ciphertext) return null;
    if (!ciphertext.includes(':')) return ciphertext; // In case it's already plaintext (legacy users)
    
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Attempt 1: Try decrypting with Global Secret (New Method)
    try {
        const globalSecret = process.env.ACCESS_TOKEN_SECRET || 'civicpulse_global_fallback_secret_2026';
        const key = getDerivedKey(globalSecret, true);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        // Attempt 2: Try decrypting with User Password (Legacy Method)
        if (password) {
            try {
                const key = getDerivedKey(password, false);
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            } catch (err) {
                return null;
            }
        }
        return null;
    }
};

 const User = mongoose.model('User', userSchema);

 export default User;
