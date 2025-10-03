import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user's rooms
 * GET /api/v1/rooms/my
 */
export const getUserRooms = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

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

        const rooms = await mg.Room.getUserRooms(currentUser._id, page, limit);

        res.status(200).json({
            success: true,
            data: {
                rooms,
                page,
                limit,
                hasMore: rooms.length === limit
            }
        });
    } catch (error) {
        logger.error('Get user rooms error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user rooms'
        });
    }
};
