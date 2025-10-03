import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Remove member from group chat
 * DELETE /api/v1/chats/:id/members/:userId
 */
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, userId } = req.params;
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

        // Only group chats can remove members
        if (!chat.isGroupChat) {
            res.status(400).json({
                success: false,
                error: 'BadRequest',
                message: 'Can only remove members from group chats'
            });
            return;
        }

        // Check if user is admin
        if (!chat.admins.some(adminId => adminId.equals(currentUser._id))) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only group admins can remove members'
            });
            return;
        }

        const memberToRemoveId = new Types.ObjectId(userId);
        await chat.removeParticipant(memberToRemoveId);

        logger.info(`Member removed from chat: ${id}, removed member: ${userId} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: { chat }
        });
    } catch (error) {
        logger.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to remove member'
        });
    }
};

