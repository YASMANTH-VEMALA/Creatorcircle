import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// Validation schema
const registerUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    college: z.string().min(2).max(200),
    passion: z.string().min(2).max(100),
    aboutMe: z.string().max(500).optional(),
    skills: z.array(z.string()).max(20).optional(),
    interests: z.array(z.string()).max(20).optional(),
    profilePhotoUrl: z.string().url().optional()
});

/**
 * Create or register a new user
 * POST /api/v1/users/register
 */
export const registerUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validatedData = registerUserSchema.parse(req.body);
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        // Check if user already exists
        const existingUser = await mg.User.findOne({ uid });
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'Conflict',
                message: 'User already registered'
            });
            return;
        }

        // Create new user
        const user = await mg.User.create({
            uid,
            email: validatedData.email,
            name: validatedData.name,
            college: validatedData.college,
            passion: validatedData.passion,
            aboutMe: validatedData.aboutMe || '',
            skills: validatedData.skills || [],
            interests: validatedData.interests || [],
            profilePhotoUrl: validatedData.profilePhotoUrl || '',
            joinedDate: new Date()
        });

        logger.info(`User registered: ${uid}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Invalid request data',
                errors: error.issues
            });
            return;
        }

        logger.error('User registration error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to register user'
        });
    }
};

