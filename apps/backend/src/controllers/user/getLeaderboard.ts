import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get leaderboard
 * GET /api/v1/users/leaderboard?limit=100
 */
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { limit = 100 } = req.query;
        const limitNum = parseInt(limit as string);

        const users = await mg.User.getLeaderboard(limitNum);

        res.status(200).json({
            success: true,
            data: { users }
        });
    } catch (error) {
        logger.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get leaderboard'
        });
    }
};

