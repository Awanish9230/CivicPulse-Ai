import mongoose from 'mongoose';
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import crypto from "crypto";

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
        enum: ['Junior', 'Senior', 'HOD'],
    },
    department: {
        type: String,
        trim: true,
        enum: ['Public Works', 'Water & Sanitation', 'Power', 'Traffic & Safety', 'Animal Control', 'General Administration', 'Master Admin'],
    },
    deviceToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
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


userSchema.pre("save", async function () {
    if (!this.isModified("password")) return ;

    this.password = await bcrypt.hash(this.password, 10);
    
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function (plainAnonymousId, plainPastIds = []) {    
    return jwt.sign(
        {
            _id: this._id,
            anonymousId: plainAnonymousId || this.anonymousId, 
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
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken; 
};

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
    return crypto.scryptSync(secret, 'civicpulse_salt_2026', 32);
}

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

userSchema.statics.decryptIdentity = function(ciphertext, password) {
    if (!ciphertext) return null;
    if (!ciphertext.includes(':')) return ciphertext; 
    
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    try {
        const globalSecret = process.env.ACCESS_TOKEN_SECRET || 'civicpulse_global_fallback_secret_2026';
        const key = getDerivedKey(globalSecret, true);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
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
