import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const updateChatSchema = z.object({
    groupName: z.string().min(1).max(100).optional(),
    groupIcon: z.string().url().optional()
});

/**
 * Update chat (group name/icon)
 * PUT /api/v1/chats/:id
 */
export const updateChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateChatSchema.parse(req.body);
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

        // Only group chats can be updated
        if (!chat.isGroupChat) {
            res.status(400).json({
                success: false,
                error: 'BadRequest',
                message: 'Only group chats can be updated'
            });
            return;
        }

        // Check if user is admin
        if (!chat.admins.some(adminId => adminId.equals(currentUser._id))) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only group admins can update the chat'
            });
            return;
        }

        // Update fields
        if (validatedData.groupName) chat.groupName = validatedData.groupName;
        if (validatedData.groupIcon !== undefined) chat.groupIcon = validatedData.groupIcon;

        await chat.save();

        logger.info(`Chat updated: ${chat._id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Chat updated successfully',
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

        logger.error('Update chat error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update chat'
        });
    }
};

