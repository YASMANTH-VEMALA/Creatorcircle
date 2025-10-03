import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const createSpotlightSchema = z.object({
    videoUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    caption: z.string().max(500).optional()
});

/**
 * Create spotlight post
 * POST /api/v1/spotlight
 */
export const createSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createSpotlightSchema.parse(req.body);
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        const currentUser = await mg.User.findOne({ uid });
        if (!currentUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        const spotlight = await mg.SpotlightPost.create({
            creatorId: currentUser._id,
            videoUrl: validatedData.videoUrl,
            thumbnailUrl: validatedData.thumbnailUrl,
            caption: validatedData.caption
        });

        logger.info(`Spotlight created: ${spotlight._id} by user ${uid}`);

        res.status(201).json({
            success: true,
            message: 'Spotlight post created successfully',
            data: { spotlight }
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

        logger.error('Create spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create spotlight post'
        });
    }
};

