import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// Validation schema
const updateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    college: z.string().min(2).max(200).optional(),
    passion: z.string().min(2).max(100).optional(),
    aboutMe: z.string().max(500).optional(),
    skills: z.array(z.string()).max(20).optional(),
    interests: z.array(z.string()).max(20).optional(),
    profilePhotoUrl: z.string().url().optional(),
    bannerPhotoUrl: z.string().url().optional(),
    personality: z.enum(['introvert', 'extrovert', 'ambivert']).optional()
});

/**
 * Update user profile
 * PUT /api/v1/users/me
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validatedData = updateUserSchema.parse(req.body);
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        // Only update allowed fields from validatedData
        const user = await mg.User.findOneAndUpdate(
            { uid },
            { $set: validatedData },
            { new: true, runValidators: true }
        );

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        logger.info(`User updated: ${uid}`);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
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

        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update user'
        });
    }
};

