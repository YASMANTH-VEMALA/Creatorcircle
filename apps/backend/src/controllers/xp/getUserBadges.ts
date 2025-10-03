import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user badges
 * GET /api/v1/users/:id/badges
 */
export const getUserBadges = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await mg.User.findById(id).select('name xp.badges verifiedBadge isVerified');

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
                badges: user.xp.badges,
                verifiedBadge: user.verifiedBadge,
                isVerified: user.isVerified,
                totalBadges: user.xp.badges.length
            }
        });
    } catch (error) {
        logger.error('Get user badges error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user badges'
        });
    }
};

