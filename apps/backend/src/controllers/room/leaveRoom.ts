import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Leave room
 * DELETE /api/v1/rooms/:id/leave
 */
export const leaveRoom = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Creator cannot leave their own room
        if (room.creatorId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Room creator cannot leave. Delete the room instead.'
            });
            return;
        }

        await room.removeMember(currentUser._id);

        logger.info(`User ${uid} left room ${id}`);

        res.status(200).json({
            success: true,
            message: 'Left room successfully'
        });
    } catch (error) {
        logger.error('Leave room error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to leave room'
        });
    }
};
