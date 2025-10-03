import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get messages for a chat
 * GET /api/v1/chats/:chatId/messages
 */
export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
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

        const chat = await mg.Chat.findById(chatId);
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

        const messages = await mg.Message.getChatMessages(chat._id, page, limit);

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
        logger.error('Get chat messages error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get messages'
        });
    }
};

