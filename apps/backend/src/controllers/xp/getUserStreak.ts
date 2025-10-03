import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user streak
 * GET /api/v1/users/:id/streak
 */
export const getUserStreak = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await mg.User.findById(id).select('name streaks');

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                userId: user._id,
                userName: user.name,
                currentStreak: user.streaks.streakCount,
                bestStreak: user.streaks.bestStreak,
                lastStreakWindowStart: user.streaks.lastStreakWindowStart,
                timezone: user.streaks.timezone
            }
        });
    } catch (error) {
        logger.error('Get user streak error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user streak'
        });
    }
};

