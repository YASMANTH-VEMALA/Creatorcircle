import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get room messages
 * GET /api/v1/rooms/:roomId/messages
 */
export const getRoomMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
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
                message: 'You must be a room member to view messages'
            });
            return;
        }

        const messages = await mg.RoomMessage.find({ roomId: room._id, isDeleted: false })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('senderId', 'name profilePhotoUrl isVerified');

        res.status(200).json({
            success: true,
            data: {
                messages,
                page,
                limit,
                hasMore: messages.length === limit
            }
        });
    } catch (error) {
        logger.error('Get room messages error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get room messages'
        });
    }
};
