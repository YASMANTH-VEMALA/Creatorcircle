import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Delete message
 * DELETE /api/v1/messages/:id
 */
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const message = await mg.Message.findById(id);
        if (!message || message.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Message not found'
            });
            return;
        }

        // Check ownership
        if (!message.senderId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only delete your own messages'
            });
            return;
        }

        await message.softDelete();

        logger.info(`Message deleted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        logger.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete message'
        });
    }
};

