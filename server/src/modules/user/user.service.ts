import crypto from "crypto";
import mongoose from "mongoose";
import User, { UserDocument, UserRole } from "./user.model.js";
import ApiError from "../../utils/ApiError.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../../services/emailService.js";
import { getIo } from "../../config/socket.js";
import type { AuthenticatedUser } from "../../types/express.js";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export const getCookieOptions = (includeMaxAge: boolean = true) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    ...(includeMaxAge && {
        maxAge: Number(process.env.COOKIE_EXPIRES_IN_DAYS || 7) * 24 * 60 * 60 * 1000,
    }),
});

export const generateAccessAndRefreshTokens = async (
    userId: mongoose.Types.ObjectId | string,
    plainAnonymousId: string,
    plainPastIds: string[] = []
): Promise<AuthTokens> => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken(plainAnonymousId, plainPastIds);
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};

export const rotateAnonymousId = async (
    authUser: AuthenticatedUser | undefined,
    password?: string
) => {
    if (!authUser) {
        throw new ApiError(401, "Unauthorized request");
    }

    const user = authUser as unknown as UserDocument;
    const plainAnonymousId = User.generateAnonymousId();
    user.pastAnonymousIds.push(user.anonymousId);
    user.anonymousId = User.encryptIdentity(plainAnonymousId);

    await user.save({ validateBeforeSave: false });

    const plainPastIds = (user.pastAnonymousIds || [])
        .map((enc) => User.decryptIdentity(enc, password))
        .filter((id): id is string => Boolean(id));

    const tokens = await generateAccessAndRefreshTokens(user._id, plainAnonymousId, plainPastIds);

    return {
        anonymousId: plainAnonymousId,
        ...tokens,
    };
};

export const registerUser = async (email?: string, password?: string) => {
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    const plainAnonymousId = User.generateAnonymousId();
    const encryptedAnonymousId = User.encryptIdentity(plainAnonymousId, password);

    const user = await User.create({
        email,
        password,
        anonymousId: encryptedAnonymousId,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Failed to register user");
    }

    sendWelcomeEmail(createdUser.email, createdUser.name, createdUser.role);

    try {
        const io = getIo();
        io.to('admin_room').emit('stats_update', { type: 'new_user', role: createdUser.role });
    } catch (err) {
        console.error("Socket error on register:", err);
    }

    return createdUser;
};

export const loginUser = async (
    email?: string,
    password?: string,
    role: UserRole = 'Citizen'
) => {
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (user.role !== role && !(role === 'Authority' && user.role === 'Admin')) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const plainAnonymousId = User.decryptIdentity(user.anonymousId, password) || user.anonymousId;
    const plainPastIds = (user.pastAnonymousIds || [])
        .map((enc) => User.decryptIdentity(enc, password))
        .filter((id): id is string => Boolean(id));

    user.anonymousId = User.encryptIdentity(plainAnonymousId);
    user.pastAnonymousIds = plainPastIds.map((id) => User.encryptIdentity(id));
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
        plainAnonymousId,
        plainPastIds
    );

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")
        .lean();

    if (loggedInUser) {
        loggedInUser.anonymousId = plainAnonymousId;
    }

    return {
        user: loggedInUser,
        accessToken,
        refreshToken,
    };
};

export const logoutUser = async (userId: mongoose.Types.ObjectId | string): Promise<void> => {
    await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );
};

export const getUserProfile = async (authUser: AuthenticatedUser) => {
    const user = await User.findById(authUser._id).select('-password -refreshToken').lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.anonymousId = authUser.anonymousId;
    return user;
};

export const forgotPassword = async (email?: string): Promise<void> => {
    if (!email) {
        throw new ApiError(400, "Please provide an email address");
    }

    const user = await User.findOne({ email });
    if (!user) {
        return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        await sendPasswordResetEmail(user.email, resetToken, user.role);
    } catch {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Email could not be sent");
    }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired token");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
};

export const getCitizenLeaderboard = async () => {
    const topUsers = await User.find({ role: 'Citizen' })
        .select('points badges')
        .sort({ points: -1 })
        .limit(20)
        .lean();

    return topUsers.map((u, index) => ({
        id: u._id,
        rank: index + 1,
        displayName: `Citizen #${u._id.toString().slice(-4)}`,
        points: u.points || 0,
        badges: u.badges || []
    }));
};
