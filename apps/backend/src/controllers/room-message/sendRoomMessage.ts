import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const sendRoomMessageSchema = z.object({
    text: z.string().min(1).max(5000),
    messageType: z.enum(['text', 'image', 'video', 'file']).optional(),
    mediaUrl: z.string().url().optional()
});

/**
 * Send room message
 * POST /api/v1/rooms/:roomId/messages
 */
export const sendRoomMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const validatedData = sendRoomMessageSchema.parse(req.body);
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

        const room = await mg.Room.findById(roomId);
        if (!room || !room.isActive) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Room not found'
            });
            return;
        }

        // Check if user is a member
        if (!room.isMember(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You must be a room member to send messages'
            });
            return;
        }

        const message = await mg.RoomMessage.create({
            roomId: room._id,
            senderId: currentUser._id,
            text: validatedData.text,
            messageType: validatedData.messageType || 'text',
            mediaUrl: validatedData.mediaUrl,
            timestamp: new Date()
        });

        logger.info(`Room message sent in room ${roomId} by user ${uid}`);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Invalid request data',
                errors: error.issues
            });
            return;
        }

        logger.error('Send room message error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to send message'
        });
    }
};
