import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const editMessageSchema = z.object({
    text: z.string().min(1).max(5000)
});

/**
 * Edit message
 * PUT /api/v1/messages/:id
 */
export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = editMessageSchema.parse(req.body);
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
                message: 'You can only edit your own messages'
            });
            return;
        }

        await message.edit(validatedData.text);

        logger.info(`Message edited: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Message edited successfully',
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

        logger.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to edit message'
        });
    }
};

