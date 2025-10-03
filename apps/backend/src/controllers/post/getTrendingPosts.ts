import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get trending posts
 * GET /api/v1/posts/trending?hours=24&limit=20
 */
export const getTrendingPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { hours = '24', limit = '20' } = req.query;

        const hoursNum = parseInt(hours as string);
        const limitNum = parseInt(limit as string);

        const posts = await mg.Post.getTrending(hoursNum, limitNum);

        res.status(200).json({
            success: true,
            data: { posts }
        });
    } catch (error) {
        logger.error('Get trending posts error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get trending posts'
        });
    }
};

