import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Clear all notifications
 * DELETE /api/v1/notifications/clear-all
 */
export const clearAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const result = await mg.Notification.deleteMany({ toUserId: currentUser._id });

        logger.info(`All notifications cleared: ${result.deletedCount} notifications for user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'All notifications cleared successfully',
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        logger.error('Clear all notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to clear all notifications'
        });
    }
};

