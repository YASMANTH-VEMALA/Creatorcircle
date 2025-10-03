import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Set default error values
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Log error details
    logger.error('API Error:', {
        error: {
            message: error.message,
            stack: error.stack,
            statusCode
        },
        request: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack,
                details: error
            })
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    const message = `Route ${req.originalUrl} not found`;

    logger.warn('404 Not Found:', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    res.status(404).json({
        success: false,
        error: {
            message,
            code: 'ROUTE_NOT_FOUND'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
