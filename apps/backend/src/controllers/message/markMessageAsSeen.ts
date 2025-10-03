import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Mark message as seen
 * POST /api/v1/messages/:id/seen
 */
export const markMessageAsSeen = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Check if user is the receiver
        if (!message.receiverId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only mark messages sent to you as seen'
            });
            return;
        }

        await message.markAsSeen();

        logger.info(`Message marked as seen: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Message marked as seen',
            data: { message }
        });
    } catch (error) {
        logger.error('Mark message as seen error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to mark message as seen'
        });
    }
};

