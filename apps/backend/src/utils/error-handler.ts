import { AppError } from '../middleware/errorHandler';

/**
 * Throw an operational error
 * This function creates and throws an error that will be caught by the error handler middleware
 */
export const throw_error = ({
    message,
    status_code = 500
}: {
    message: string;
    status_code?: number
}): never => {
    const error = new Error(message) as AppError;
    error.statusCode = status_code;
    error.isOperational = true;
    throw error;
};

