import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get room by ID
 * GET /api/v1/rooms/:id
 */
export const getRoomById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const room = await mg.Room.findById(id)
            .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge');

        if (!room || !room.isActive) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Room not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { room }
        });
    } catch (error) {
        logger.error('Get room by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get room'
        });
    }
};
