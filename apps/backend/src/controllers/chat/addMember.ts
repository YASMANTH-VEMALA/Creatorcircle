import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { Types } from 'mongoose';

const addMemberSchema = z.object({
    userId: z.string()
});

/**
 * Add member to group chat
 * POST /api/v1/chats/:id/members
 */
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = addMemberSchema.parse(req.body);
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

        // Only group chats can add members
        if (!chat.isGroupChat) {
            res.status(400).json({
                success: false,
                error: 'BadRequest',
                message: 'Can only add members to group chats'
            });
            return;
        }

        // Check if user is admin
        if (!chat.admins.some(adminId => adminId.equals(currentUser._id))) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only group admins can add members'
            });
            return;
        }

        const newMemberId = new Types.ObjectId(validatedData.userId);
        const newMember = await mg.User.findById(newMemberId);
        if (!newMember) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User to add not found'
            });
            return;
        }

        await chat.addParticipant(newMemberId);

        logger.info(`Member added to chat: ${id}, new member: ${validatedData.userId} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Member added successfully',
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

        logger.error('Add member error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to add member'
        });
    }
};

