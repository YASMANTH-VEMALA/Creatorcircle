import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { Types } from 'mongoose';

const createGroupChatSchema = z.object({
    participantIds: z.array(z.string()).min(1),
    groupName: z.string().min(1).max(100),
    groupIcon: z.string().url().optional()
});

/**
 * Create group chat
 * POST /api/v1/chats/group
 */
export const createGroupChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createGroupChatSchema.parse(req.body);
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

        // Convert string IDs to ObjectIds
        const participantIds = validatedData.participantIds.map((id: string) => new Types.ObjectId(id));

        // Verify all participants exist
        const participants = await mg.User.find({ _id: { $in: participantIds } });
        if (participants.length !== participantIds.length) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'One or more participants not found'
            });
            return;
        }

        // Create group chat
        const groupChat = await mg.Chat.createGroupChat(
            currentUser._id,
            participantIds,
            validatedData.groupName,
            validatedData.groupIcon
        );

        logger.info(`Group chat created: ${groupChat._id} by user ${uid}`);

        res.status(201).json({
            success: true,
            message: 'Group chat created successfully',
            data: { chat: groupChat }
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

        logger.error('Create group chat error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create group chat'
        });
    }
};

