import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get public rooms
 * GET /api/v1/rooms
 */
export const getPublicRooms = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const rooms = await mg.Room.getPublicRooms(page, limit);

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
        logger.error('Get public rooms error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get public rooms'
        });
    }
};
