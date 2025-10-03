import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const createDirectChatSchema = z.object({
    participantId: z.string()
});

/**
 * Create direct chat
 * POST /api/v1/chats/direct
 */
export const createDirectChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createDirectChatSchema.parse(req.body);
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

        const participant = await mg.User.findById(validatedData.participantId);
        if (!participant) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Participant not found'
            });
            return;
        }

        // Find or create direct chat
        const chat = await mg.Chat.findOrCreateDirectChat(currentUser._id, participant._id);

        logger.info(`Direct chat created/found: ${chat._id} between ${uid} and ${participant.uid}`);

        res.status(201).json({
            success: true,
            message: 'Direct chat created successfully',
            data: { chat }
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

        logger.error('Create direct chat error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create direct chat'
        });
    }
};

