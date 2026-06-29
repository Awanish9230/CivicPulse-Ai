import asynchandler from "../utils/asynchandler.js" 
import ApiError from "../utils/ApiError.js"
import User from "../models/User.js"
import  ApiResponse  from "../utils/ApiResponse.js"
  
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
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

    user.anonymousId = User.generateAnonymousId();

    await user.save({
        validateBeforeSave: false
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                anonymousId: user.anonymousId
            },
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
    // 4. Create user
    const user = await User.create({
        email,
        password,
        anonymousId: User.generateAnonymousId(),
    });
    // 5. Fetch created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Failed to register user");
    }
    // 6. Send response
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
    const { email, password } = req.body;

    // 2. Validate input
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 3. Find user
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 4. Check if account is banned
    if (user.isBanned) {
        throw new ApiError(
            403,
            "Your account has been banned. Please contact support."
        );
    }

    // 5. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // 6. Generate tokens
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    // 7. Fetch updated user without sensitive fields
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

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
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
    );
});