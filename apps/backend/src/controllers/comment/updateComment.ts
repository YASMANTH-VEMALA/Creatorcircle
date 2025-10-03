import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';
import { z } from 'zod';

const updateCommentSchema = z.object({
    content: z.string().min(1).max(1000)
});

/**
 * Update comment
 * PUT /api/v1/comments/:id
 */
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = updateCommentSchema.parse(req.body);
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

        const comment = await mg.Comment.findById(id);
        if (!comment) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Comment not found'
            });
            return;
        }

        if (!comment.userId.equals(currentUser._id as Types.ObjectId)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only edit your own comments'
            });
            return;
        }

        comment.content = validatedData.content;
        await comment.save();

        logger.info(`Comment updated: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Comment updated successfully',
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

        logger.error('Update comment error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update comment'
        });
    }
};
