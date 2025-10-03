import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Join room
 * POST /api/v1/rooms/:id/join
 */
export const joinRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
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

        const room = await mg.Room.findById(id);
        if (!room || !room.isActive) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Room not found'
            });
            return;
        }

        await room.addMember(currentUser._id);

        logger.info(`User ${uid} joined room ${id}`);

        res.status(200).json({
            success: true,
            message: 'Joined room successfully',
            data: { room }
        });
    } catch (error) {
        logger.error('Join room error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to join room'
        });
    }
};
