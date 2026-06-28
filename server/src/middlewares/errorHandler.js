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
    const statusCode = err.statusCode || 500;

    logger.error(
        `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        data: null,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,                //change the "devlopment" to production when psuhing change in main
    });
};
