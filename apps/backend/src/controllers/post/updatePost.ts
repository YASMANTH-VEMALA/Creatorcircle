import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';
import { z } from 'zod';

const updatePostSchema = z.object({
    content: z.string().min(1).max(5000).optional(),
    emoji: z.string().max(10).optional()
});

/**
 * Update post
 * PUT /api/v1/posts/:id
 */
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = updatePostSchema.parse(req.body);
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

        const currentUser = await mg.User.findOne({ uid });
        if (!currentUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
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

        if (!post.userId.equals(currentUser._id as Types.ObjectId)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only edit your own posts'
            });
            return;
        }

        if (validatedData.content) post.content = validatedData.content;
        if (validatedData.emoji !== undefined) post.emoji = validatedData.emoji;

        await post.save();

        logger.info(`Post updated: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
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

        logger.error('Update post error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update post'
        });
    }
};

