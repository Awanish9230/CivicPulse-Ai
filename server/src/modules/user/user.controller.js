import asynchandler from "../../utils/asynchandler.js" 
import ApiError from "../../utils/ApiError.js"
import User from "./user.model.js"
import ApiResponse from "../../utils/ApiResponse.js"
import crypto from "crypto";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../../services/emailService.js";
import { getIo } from "../../config/socket.js";
  
const generateAccessAndRefreshTokens = async (userId, plainAnonymousId, plainPastIds = []) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken(plainAnonymousId, plainPastIds);
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false,
        });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};

//rotate anonymous id 
export const rotateAnonymousId = asynchandler(async (req, res) => {

    const user = req.user;
 
    if (!user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const plainAnonymousId = User.generateAnonymousId();
    user.pastAnonymousIds.push(user.anonymousId); // Save the old encrypted ID
    user.anonymousId = User.encryptIdentity(plainAnonymousId);

    await user.save({
        validateBeforeSave: false
    });

    // Decrypt all past IDs to send in the new token
    // We pass password (if they provided one for manual rotation) just in case they have legacy encrypted IDs
    const { password } = req.body || {};
    const plainPastIds = (user.pastAnonymousIds || []).map(enc => User.decryptIdentity(enc, password)).filter(Boolean);
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, plainAnonymousId, plainPastIds);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { anonymousId: plainAnonymousId },
                "Anonymous ID rotated successfully"
            )
        );

});



export const registerUser = asynchandler(async (req, res) => {
    // 1. Get data
    const { email, password } = req.body;
    // 2. Validate input
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    // 3. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }
    const plainAnonymousId = User.generateAnonymousId();
    const encryptedAnonymousId = User.encryptIdentity(plainAnonymousId, password);

    // 4. Create user
    const user = await User.create({
        email,
        password,
        anonymousId: encryptedAnonymousId,
    });
    // 5. Fetch created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Failed to register user");
    }
    
    // 6. Send welcome email asynchronously
    sendWelcomeEmail(createdUser.email, createdUser.name, createdUser.role);

    // Emit real-time update to admin dashboard
    try {
        const io = getIo();
        io.to('admin_room').emit('stats_update', { type: 'new_user', role: createdUser.role });
    } catch (err) {
        console.error("Socket error on register:", err);
    }

    // 7. Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});


export const loginUser = asynchandler(async (req, res) => {

    // 1. Get credentials
    const { email, password, role = 'Citizen' } = req.body;

    // 2. Validate input
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 3. Find user
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    // 4. Verify role (Security: Don't leak actual role if they try wrong portal)
    if (user.role !== role) {
        // Allow Admin to log in to Authority dashboard
        if (!(role === 'Authority' && user.role === 'Admin')) {
            throw new ApiError(401, "Invalid email or password");
        }
    }

    // 5. Check if account is banned
    if (user.isBanned) {
        throw new ApiError(
            403,
            "Your account has been banned. Please contact support."
        );
    }

    // 6. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Decrypt Identity
    const plainAnonymousId = User.decryptIdentity(user.anonymousId, password) || user.anonymousId;
    const plainPastIds = (user.pastAnonymousIds || []).map(enc => User.decryptIdentity(enc, password)).filter(Boolean);

    // MIGRATION: Automatically migrate to Global Secret encryption on login
    user.anonymousId = User.encryptIdentity(plainAnonymousId);
    user.pastAnonymousIds = plainPastIds.map(id => User.encryptIdentity(id));
    await user.save({ validateBeforeSave: false });

    // 6. Generate tokens
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id, plainAnonymousId, plainPastIds);

    // 7. Fetch updated user without sensitive fields
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ).lean();
    loggedInUser.anonymousId = plainAnonymousId;

    // 8. Cookie options
   const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
        process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
    };

    // 9. Send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                },
                "User logged in successfully"
            )
        );
});

export const logoutUser = asynchandler(async (req, res) => {

    // Remove refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );

});

export const getMe = asynchandler(async (req, res) => {
    // 7. Fetch user and inject plain anonymousId
    const user = await User.findById(req.user._id).select('-password -refreshToken').lean();
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user.anonymousId = req.user.anonymousId;

    return res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
    );
});

export const forgotPassword = asynchandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Please provide an email address");
    }

    const user = await User.findOne({ email });

    if (!user) {
        // Return generic message to prevent user enumeration
        return res.status(200).json(new ApiResponse(200, {}, "If that email address is in our database, we will send you an email to reset your password."));
    }

    // Get reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
        await sendPasswordResetEmail(user.email, resetToken, user.role);
        return res.status(200).json(new ApiResponse(200, {}, "If that email address is in our database, we will send you an email to reset your password."));
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Email could not be sent");
    }
});

export const resetPassword = asynchandler(async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired token");
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
});