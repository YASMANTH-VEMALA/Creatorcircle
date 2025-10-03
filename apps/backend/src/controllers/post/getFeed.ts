import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Get feed posts
 * GET /api/v1/posts/feed?page=1&limit=20
 */
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

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

        // Get IDs of users being followed
        const followingIds = await mg.Follow.getFollowingIds(currentUser._id as Types.ObjectId);

        // Include current user's posts in feed
        followingIds.push(currentUser._id as Types.ObjectId);

        // Get feed posts
        const posts = await mg.Post.getFeed(followingIds, pageNum, limitNum);

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: pageNum,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        logger.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get feed'
        });
    }
};

