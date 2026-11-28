import mongoose, { HydratedDocument, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { PushSubscription } from 'web-push';

export type UserRole = 'Citizen' | 'Authority' | 'Admin';
export type AuthorityLevel = 'Junior' | 'Senior' | 'HOD';
export type DutyStatus = 'On Duty' | 'Off Duty' | 'On Leave' | 'Busy';
export type Department =
    | 'Public Works'
    | 'Water & Sanitation'
    | 'Power'
    | 'Traffic & Safety'
    | 'Animal Control'
    | 'General Administration'
    | 'Master Admin';

export interface IUser {
    email: string;
    password: string;
    anonymousId: string;
    pastAnonymousIds: string[];
    role: UserRole;
    name?: string;
    phone?: string;
    bio?: string;
    pushSubscriptions: PushSubscription[];
    authorityLevel?: AuthorityLevel;
    department?: Department;
    dutyStatus: DutyStatus;
    isAuthorityAdmin: boolean;
    customRole?: mongoose.Types.ObjectId | null;
    permissions: string[];
    isActive: boolean;
    lastSeenAt?: Date;
    deviceToken?: string;
    refreshToken?: string;
    strikes: number;
    points: number;
    badges: string[];
    isBanned: boolean;
    banUntil: Date | null;
    restrictedFeatures: string[];
    resetPasswordToken?: string;
    resetPasswordExpire?: Date | number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserMethods {
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(plainAnonymousId?: string, plainPastIds?: string[]): string;
    generateRefreshToken(): string;
    generatePasswordResetToken(): string;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export interface IUserModel extends Model<IUser, object, IUserMethods> {
    generateAnonymousId(): string;
    encryptIdentity(plaintext: string | null | undefined, password?: string): string;
    decryptIdentity(ciphertext: string | null | undefined, password?: string): string | null;
}

const userSchema = new mongoose.Schema<IUser, IUserModel, IUserMethods>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
    phone: {
        type: String,
        trim: true,
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 300,
    },
    pushSubscriptions: {
        type: [mongoose.Schema.Types.Mixed] as unknown as PushSubscription[],
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
    dutyStatus: {
        type: String,
        enum: ['On Duty', 'Off Duty', 'On Leave', 'Busy'],
        default: 'On Duty',
    },
    isAuthorityAdmin: {
        type: Boolean,
        default: false,
    },
    customRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null,
    },
    permissions: {
        type: [String],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
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
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (
    plainAnonymousId?: string,
    plainPastIds: string[] = []
): string {
    return jwt.sign(
        {
            _id: this._id,
            anonymousId: plainAnonymousId || this.anonymousId,
            pastAnonymousIds: plainPastIds
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_REFRESH_SECRET as string,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
        }
    );
};

userSchema.methods.generatePasswordResetToken = function (): string {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    return resetToken;
};

userSchema.statics.generateAnonymousId = function (): string {
    return `CP-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
};

const keyCache = new Map<string, Buffer>();

function getDerivedKey(secret: string, isGlobalSecret: boolean = false): Buffer {
    if (isGlobalSecret) {
        const cached = keyCache.get(secret);
        if (!cached) {
            const derived = crypto.scryptSync(secret, 'civicpulse_salt_2026', 32);
            keyCache.set(secret, derived);
            return derived;
        }
        return cached;
    }
    return crypto.scryptSync(secret, 'civicpulse_salt_2026', 32);
}

userSchema.statics.encryptIdentity = function (plaintext: string | null | undefined): string {
    if (!plaintext) return '';
    const globalSecret = process.env.ACCESS_TOKEN_SECRET || 'civicpulse_global_fallback_secret_2026';
    const key = getDerivedKey(globalSecret, true);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

userSchema.statics.decryptIdentity = function (
    ciphertext: string | null | undefined,
    password?: string
): string | null {
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
    } catch {
        if (password) {
            try {
                const key = getDerivedKey(password, false);
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            } catch {
                return null;
            }
        }
        return null;
    }
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
