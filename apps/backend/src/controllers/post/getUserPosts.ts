import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Get user's posts
 * GET /api/v1/posts/user/:userId?page=1&limit=20
 */
export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        const posts = await mg.Post.getUserPosts(
            new Types.ObjectId(userId),
            pageNum,
            limitNum
        );

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
        logger.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user posts'
        });
    }
};

