import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const count = await mg.Notification.getUnreadCount(currentUser._id);

        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        logger.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get unread count'
        });
    }
};

