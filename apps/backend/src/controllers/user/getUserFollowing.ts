import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Get user's following
 * GET /api/v1/users/:id/following?page=1&limit=20
 */
export const getUserFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        const following = await mg.Follow.getFollowing(
            new Types.ObjectId(id),
            pageNum,
            limitNum
        );

        res.status(200).json({
            success: true,
            data: { following }
        });
    } catch (error) {
        logger.error('Get user following error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get following'
        });
    }
};

