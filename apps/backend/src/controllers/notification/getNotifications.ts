import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user's notifications
 * GET /api/v1/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const unreadOnly = req.query.unreadOnly === 'true';

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

        const notifications = await mg.Notification.getUserNotifications(
            currentUser._id,
            unreadOnly,
            page,
            limit
        );

        res.status(200).json({
            success: true,
            data: {
                notifications,
                page,
                limit,
                hasMore: notifications.length === limit
            }
        });
    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get notifications'
        });
    }
};

