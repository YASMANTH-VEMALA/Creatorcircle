import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Cancel collaboration request
 * DELETE /api/v1/collaborations/:id
 */
export const cancelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const request = await mg.CollaborationRequest.findById(id);
        if (!request) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Collaboration request not found'
            });
            return;
        }

        // Check if user is the sender
        if (!request.senderId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only cancel requests you sent'
            });
            return;
        }

        await request.deleteOne();

        logger.info(`Collaboration request canceled: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Collaboration request canceled successfully'
        });
    } catch (error) {
        logger.error('Cancel collaboration request error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to cancel collaboration request'
        });
    }
};

