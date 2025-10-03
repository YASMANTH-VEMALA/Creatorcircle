import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Check/update user streak
 * POST /api/v1/users/streak/check
 */
export const checkStreak = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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

        // Update streak
        currentUser.updateStreak();
        await currentUser.save();

        // Award XP for maintaining streak
        const streakBonus = Math.min(currentUser.streaks.streakCount * 2, 50); // Max 50 XP bonus
        if (currentUser.streaks.streakCount > 0) {
            await currentUser.addXP(streakBonus, `Streak bonus (${currentUser.streaks.streakCount} days)`);
        }

        logger.info(`Streak checked for user ${uid}: ${currentUser.streaks.streakCount} days`);

        res.status(200).json({
            success: true,
            message: 'Streak updated successfully',
            data: {
                currentStreak: currentUser.streaks.streakCount,
                bestStreak: currentUser.streaks.bestStreak,
                xpAwarded: streakBonus,
                totalXP: currentUser.xp.xp,
                level: currentUser.xp.level
            }
        });
    } catch (error) {
        logger.error('Check streak error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to check streak'
        });
    }
};

