import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Accept collaboration request
 * PUT /api/v1/collaborations/:id/accept
 */
export const acceptRequest = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Check if user is the receiver
        if (!request.receiverId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only accept requests sent to you'
            });
            return;
        }

        await request.accept();

        logger.info(`Collaboration request accepted: ${id} by user ${uid}`);

        // Create notification for sender
        await mg.Notification.createNotification(
            'request_accepted',
            request.senderId,
            `${currentUser.name} accepted your collaboration request`,
            {
                fromUserId: currentUser._id,
                senderName: currentUser.name,
                senderProfilePic: currentUser.profilePhotoUrl,
                senderVerified: currentUser.isVerified
            }
        );

        res.status(200).json({
            success: true,
            message: 'Collaboration request accepted successfully',
            data: { request }
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: 'BadRequest',
                message: error.message
            });
            return;
        }

        logger.error('Accept collaboration request error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to accept collaboration request'
        });
    }
};

