import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user XP details
 * GET /api/v1/users/:id/xp
 */
export const getUserXP = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await mg.User.findById(id).select('name xp');

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
                xp: user.xp.xp,
                level: user.xp.level,
                badges: user.xp.badges,
                lastDecayAppliedAt: user.xp.lastDecayAppliedAt
            }
        });
    } catch (error) {
        logger.error('Get user XP error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user XP'
        });
    }
};

