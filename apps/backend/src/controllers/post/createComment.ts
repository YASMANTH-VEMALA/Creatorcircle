import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';
import { z } from 'zod';

const commentSchema = z.object({
    content: z.string().min(1).max(1000),
    replyToCommentId: z.string().optional()
});

/**
 * Create comment on post
 * POST /api/v1/posts/:id/comments
 */
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = commentSchema.parse(req.body);
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

        // Verify post exists
        const post = await mg.Post.findById(id);
        if (!post || post.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Post not found'
            });
            return;
        }

        // Create comment
        const commentData: Record<string, unknown> = {
            postId: new Types.ObjectId(id),
            userId: currentUser._id,
            content: validatedData.content
        };

        if (validatedData.replyToCommentId) {
            const parentComment = await mg.Comment.findById(validatedData.replyToCommentId);
            if (parentComment) {
                commentData.replyToCommentId = new Types.ObjectId(validatedData.replyToCommentId);
                commentData.replyToUserId = parentComment.userId;
            }
        }

        const comment = await mg.Comment.create(commentData);

        logger.info(`Comment created on post ${id} by user ${uid}`);

        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            data: { comment }
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

        logger.error('Create comment error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create comment'
        });
    }
};

