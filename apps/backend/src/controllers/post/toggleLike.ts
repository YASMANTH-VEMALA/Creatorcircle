import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Like/Unlike a post
 * POST /api/v1/posts/:id/like
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

        // Check if already liked
        const existingLike = await mg.Like.hasLiked(
            currentUser._id as Types.ObjectId,
            'post',
            new Types.ObjectId(id)
        );

        if (existingLike) {
            // Unlike
            await mg.Like.unlikeTarget(
                currentUser._id as Types.ObjectId,
                'post',
                new Types.ObjectId(id)
            );

            res.status(200).json({
                success: true,
                message: 'Post unliked',
                data: { liked: false }
            });
        } else {
            // Like
            await mg.Like.likeTarget(
                currentUser._id as Types.ObjectId,
                'post',
                new Types.ObjectId(id)
            );

            res.status(200).json({
                success: true,
                message: 'Post liked',
                data: { liked: true }
            });
        }
    } catch (error) {
        logger.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to toggle like'
        });
    }
};

