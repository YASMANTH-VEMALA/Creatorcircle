import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get chat by ID
 * GET /api/v1/chats/:id
 */
export const getChatById = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const chat = await mg.Chat.findById(id)
            .populate('participants', 'name college profilePhotoUrl isVerified');

        if (!chat) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Chat not found'
            });
            return;
        }

        // Check if user is a participant
        if (!chat.isParticipant(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You are not a participant in this chat'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { chat }
        });
    } catch (error) {
        logger.error('Get chat by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get chat'
        });
    }
};

