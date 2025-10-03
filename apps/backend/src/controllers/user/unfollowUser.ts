import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Unfollow a user
 * DELETE /api/v1/users/:id/follow
 */
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id: targetUserId } = req.params;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        // Get current user
        const currentUser = await mg.User.findOne({ uid });
        if (!currentUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Current user not found'
            });
            return;
        }

        // Unfollow the user
        const success = await mg.Follow.unfollowUser(
            currentUser._id as Types.ObjectId,
            new Types.ObjectId(targetUserId)
        );

        res.status(200).json({
            success: true,
            message: success ? 'User unfollowed successfully' : 'Not following this user'
        });
    } catch (error) {
        logger.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to unfollow user'
        });
    }
};

