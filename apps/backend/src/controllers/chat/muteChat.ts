import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Mute chat
 * POST /api/v1/chats/:id/mute
 */
export const muteChat = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const chat = await mg.Chat.findById(id);
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

        await chat.mute(currentUser._id);

        logger.info(`Chat muted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Chat muted successfully',
            data: { chat }
        });
    } catch (error) {
        logger.error('Mute chat error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to mute chat'
        });
    }
};

