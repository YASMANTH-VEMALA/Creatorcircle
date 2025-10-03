import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const count = await mg.Notification.markAllAsRead(currentUser._id);

        logger.info(`All notifications marked as read: ${count} notifications for user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            data: { markedCount: count }
        });
    } catch (error) {
        logger.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to mark all notifications as read'
        });
    }
};

