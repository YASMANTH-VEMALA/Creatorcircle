import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { body, param, query } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: 'Invalid request data',
            errors: errors.array()
        });
        return;
    }

    next();
};

/**
 * Validation rules for user registration
 */
export const validateUserRegistration: ValidationChain[] = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('college')
        .trim()
        .notEmpty().withMessage('College is required')
        .isLength({ min: 2, max: 200 }).withMessage('College name must be 2-200 characters'),

    body('passion')
        .trim()
        .notEmpty().withMessage('Passion is required')
        .isLength({ min: 2, max: 100 }).withMessage('Passion must be 2-100 characters'),

    body('aboutMe')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('About me must be less than 500 characters'),

    body('skills')
        .optional()
        .isArray().withMessage('Skills must be an array')
        .custom((skills) => skills.length <= 20).withMessage('Maximum 20 skills allowed'),

    body('interests')
        .optional()
        .isArray().withMessage('Interests must be an array')
        .custom((interests) => interests.length <= 20).withMessage('Maximum 20 interests allowed')
];

/**
 * Validation rules for user profile update
 */
export const validateUserUpdate: ValidationChain[] = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('college')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('College name must be 2-200 characters'),

    body('passion')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Passion must be 2-100 characters'),

    body('aboutMe')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('About me must be less than 500 characters'),

    body('skills')
        .optional()
        .isArray().withMessage('Skills must be an array')
        .custom((skills) => skills.length <= 20).withMessage('Maximum 20 skills allowed'),

    body('interests')
        .optional()
        .isArray().withMessage('Interests must be an array')
        .custom((interests) => interests.length <= 20).withMessage('Maximum 20 interests allowed'),

    body('profilePhotoUrl')
        .optional()
        .trim()
        .isURL().withMessage('Invalid profile photo URL'),

    body('bannerPhotoUrl')
        .optional()
        .trim()
        .isURL().withMessage('Invalid banner photo URL')
];

/**
 * Validation rules for post creation
 */
export const validatePostCreation: ValidationChain[] = [
    body('content')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),

    body('emoji')
        .optional()
        .trim()
        .isLength({ max: 10 }).withMessage('Emoji must be less than 10 characters'),

    body('images')
        .optional()
        .isArray().withMessage('Images must be an array')
        .custom((images) => images.length <= 10).withMessage('Maximum 10 images allowed'),

    body('videos')
        .optional()
        .isArray().withMessage('Videos must be an array')
        .custom((videos) => videos.length <= 3).withMessage('Maximum 3 videos allowed')
];

/**
 * Validation rules for post update
 */
export const validatePostUpdate: ValidationChain[] = [
    body('content')
        .optional()
        .trim()
        .isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),

    body('emoji')
        .optional()
        .trim()
        .isLength({ max: 10 }).withMessage('Emoji must be less than 10 characters')
];

/**
 * Validation rules for MongoDB ObjectId parameters
 */
export const validateObjectId = (paramName: string = 'id'): ValidationChain[] => [
    param(paramName)
        .notEmpty().withMessage(`${paramName} is required`)
        .isMongoId().withMessage(`Invalid ${paramName} format`)
];

/**
 * Validation rules for pagination
 */
export const validatePagination: ValidationChain[] = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
];

/**
 * Validation for comment creation
 */
export const validateCommentCreation: ValidationChain[] = [
    body('content')
        .trim()
        .notEmpty().withMessage('Comment content is required')
        .isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),

    body('replyToCommentId')
        .optional()
        .isMongoId().withMessage('Invalid reply comment ID')
];

export default {
    handleValidationErrors,
    validateUserRegistration,
    validateUserUpdate,
    validatePostCreation,
    validatePostUpdate,
    validateObjectId,
    validatePagination,
    validateCommentCreation
};

