import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Delete room
 * DELETE /api/v1/rooms/:id
 */
export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Only creator can delete
        if (!room.creatorId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only the room creator can delete the room'
            });
            return;
        }

        room.isActive = false;
        await room.save();

        logger.info(`Room deleted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        logger.error('Delete room error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete room'
        });
    }
};
