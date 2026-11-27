import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.js';
import ApiError from "../utils/ApiError.js";

interface ExtendedError extends Error {
    statusCode?: number;
    errors?: unknown[] | Record<string, { message: string }>;
    path?: string;
    code?: number;
    keyValue?: Record<string, unknown>;
}

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
    next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

export const errorHandler = (
    err: ExtendedError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    const errors = Array.isArray(err.errors) ? err.errors : [];

    if (err.name === 'CastError') {
        message = `Resource not found. Invalid: ${err.path}`;
        statusCode = 404;
    }

    if (err.code === 11000 && err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        message = `An account with that ${field} already exists.`;
        statusCode = 400;
    }

    if (err.name === 'ValidationError' && err.errors && !Array.isArray(err.errors)) {
        message = Object.values(err.errors).map((val) => val.message).join(', ');
        statusCode = 400;
    }

    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid authentication token. Please log in again.';
        statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Your session has expired. Please log in again.';
        statusCode = 401;
    }

    logger.error(
        `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );

    res.status(statusCode).json({
        success: false,
        message,
        errors,
        data: null
    });
};
