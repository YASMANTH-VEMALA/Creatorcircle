import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const addReactionSchema = z.object({
    emoji: z.string().min(1).max(10)
});

/**
 * Add reaction to post
 * POST /api/v1/posts/:id/reactions
 */
export const addReaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = addReactionSchema.parse(req.body);
        const { id } = req.params;
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        const post = await mg.Post.findById(id);
        if (!post || post.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Post not found'
            });
            return;
        }

        await post.addReaction(validatedData.emoji);

        res.status(200).json({
            success: true,
            message: 'Reaction added',
            data: { post }
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

        logger.error('Add reaction error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to add reaction'
        });
    }
};

