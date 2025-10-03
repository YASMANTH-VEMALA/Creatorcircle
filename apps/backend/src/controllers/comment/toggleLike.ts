import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Like/Unlike a comment
 * POST /api/v1/comments/:id/like
 */
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const existingLike = await mg.Like.hasLiked(
            currentUser._id as Types.ObjectId,
            'comment',
            new Types.ObjectId(id)
        );

        if (existingLike) {
            await mg.Like.unlikeTarget(
                currentUser._id as Types.ObjectId,
                'comment',
                new Types.ObjectId(id)
            );

            res.status(200).json({
                success: true,
                message: 'Comment unliked',
                data: { liked: false }
            });
        } else {
            await mg.Like.likeTarget(
                currentUser._id as Types.ObjectId,
                'comment',
                new Types.ObjectId(id)
            );

            res.status(200).json({
                success: true,
                message: 'Comment liked',
                data: { liked: true }
            });
        }
    } catch (error) {
        logger.error('Toggle like comment error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to toggle like'
        });
    }
};
