import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const updateSpotlightSchema = z.object({
    caption: z.string().max(500).optional(),
    thumbnailUrl: z.string().url().optional(),
    isPublic: z.boolean().optional()
});

/**
 * Update spotlight post
 * PUT /api/v1/spotlight/:id
 */
export const updateSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateSpotlightSchema.parse(req.body);
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

        const spotlight = await mg.SpotlightPost.findById(id);
        if (!spotlight || spotlight.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Spotlight post not found'
            });
            return;
        }

        // Check ownership
        if (!spotlight.creatorId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only update your own spotlight posts'
            });
            return;
        }

        // Update fields
        if (validatedData.caption !== undefined) spotlight.caption = validatedData.caption;
        if (validatedData.thumbnailUrl !== undefined) spotlight.thumbnailUrl = validatedData.thumbnailUrl;
        if (validatedData.isPublic !== undefined) spotlight.isPublic = validatedData.isPublic;

        await spotlight.save();

        logger.info(`Spotlight updated: ${spotlight._id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Spotlight post updated successfully',
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

        logger.error('Update spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update spotlight post'
        });
    }
};

