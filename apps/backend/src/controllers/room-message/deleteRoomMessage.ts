import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Delete room message
 * DELETE /api/v1/room-messages/:id
 */
export const deleteRoomMessage = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const message = await mg.RoomMessage.findById(id);
        if (!message || message.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Message not found'
            });
            return;
        }

        const room = await mg.Room.findById(message.roomId);
        if (!room) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Room not found'
            });
            return;
        }

        // Check if user is message sender or room admin
        const isSender = message.senderId.equals(currentUser._id);
        const isAdmin = room.isAdmin(currentUser._id);

        if (!isSender && !isAdmin) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only delete your own messages or be a room admin'
            });
            return;
        }

        message.isDeleted = true;
        message.text = 'This message was deleted';
        await message.save();

        logger.info(`Room message deleted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        logger.error('Delete room message error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete message'
        });
    }
};
