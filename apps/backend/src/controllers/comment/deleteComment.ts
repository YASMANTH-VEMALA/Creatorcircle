import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Delete comment
 * DELETE /api/v1/comments/:id
 */
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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
                message: 'You can only delete your own comments'
            });
            return;
        }

        await mg.Comment.findByIdAndDelete(id);

        logger.info(`Comment deleted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        logger.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete comment'
        });
    }
};
