import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const sendMessageSchema = z.object({
    text: z.string().min(1).max(5000),
    messageType: z.enum(['text', 'image', 'video', 'file']).optional(),
    mediaUrl: z.string().url().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional()
});

/**
 * Send message in a chat
 * POST /api/v1/chats/:chatId/messages
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const validatedData = sendMessageSchema.parse(req.body);
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

        // Determine receiver (for direct chat)
        const receiverId = chat.isGroupChat
            ? chat.participants[0] // For group chats, we can use the first participant or handle differently
            : chat.participants.find(id => !id.equals(currentUser._id))!;

        const message = await mg.Message.sendMessage(
            chat._id,
            currentUser._id,
            receiverId,
            validatedData.text,
            validatedData.messageType || 'text',
            validatedData.mediaUrl,
            validatedData.fileName,
            validatedData.fileSize
        );

        logger.info(`Message sent in chat ${chatId} by user ${uid}`);

        // Create notification for receiver(s)
        if (!chat.isGroupChat) {
            await mg.Notification.createNotification(
                'message',
                receiverId,
                `${currentUser.name} sent you a message`,
                {
                    fromUserId: currentUser._id,
                    senderName: currentUser.name,
                    senderProfilePic: currentUser.profilePhotoUrl,
                    senderVerified: currentUser.isVerified,
                    relatedChatId: chat._id
                }
            );
        }

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

        logger.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to send message'
        });
    }
};

