import logger from '../utils/logger.js';
import ApiError from "../utils/ApiError.js";

export const notFound = (req, res, next) => {
    next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};
// export const notFound = (req, res, next) => {
//     const error = new Error(`Not Found - ${req.originalUrl}`);
//     res.status(404);
//     next(error);
// };

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = `Resource not found. Invalid: ${err.path}`;
        statusCode = 404;
    }

    // Mongoose Duplicate Key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `An account with that ${field} already exists.`;
        statusCode = 400;
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map(val => val.message).join(', ');
        statusCode = 400;
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid authentication token. Please log in again.';
        statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Your session has expired. Please log in again.';
        statusCode = 401;
    }

    // Log the actual error for backend debugging
    logger.error(
        `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );

    // Send a clean, production-like error to the frontend
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        data: null
    });
};
