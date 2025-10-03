import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { Types } from 'mongoose';

const sendRequestSchema = z.object({
    receiverId: z.string(),
    message: z.string().min(1).max(1000)
});

/**
 * Send collaboration request
 * POST /api/v1/collaborations
 */
export const sendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = sendRequestSchema.parse(req.body);
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

        const receiverId = new Types.ObjectId(validatedData.receiverId);

        const request = await mg.CollaborationRequest.sendRequest(
            currentUser._id,
            receiverId,
            validatedData.message
        );

        logger.info(`Collaboration request sent from ${uid} to ${validatedData.receiverId}`);

        res.status(201).json({
            success: true,
            message: 'Collaboration request sent successfully',
            data: { request }
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

        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: 'BadRequest',
                message: error.message
            });
            return;
        }

        logger.error('Send collaboration request error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to send collaboration request'
        });
    }
};

