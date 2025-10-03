import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Delete chat
 * DELETE /api/v1/chats/:id
 */
export const deleteChat = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // For group chats, only admins can delete
        if (chat.isGroupChat) {
            if (!chat.admins.some(adminId => adminId.equals(currentUser._id))) {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'Only group admins can delete the chat'
                });
                return;
            }
        } else {
            // For direct chats, any participant can delete
            if (!chat.isParticipant(currentUser._id)) {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'You must be a participant to delete this chat'
                });
                return;
            }
        }

        await chat.deleteOne();

        logger.info(`Chat deleted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        logger.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete chat'
        });
    }
};

