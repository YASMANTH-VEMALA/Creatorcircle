import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Follow a user
 * POST /api/v1/users/:id/follow
 */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Follow the user
        const result = await mg.Follow.followUser(
            currentUser._id as Types.ObjectId,
            new Types.ObjectId(targetUserId)
        );

        res.status(200).json({
            success: true,
            message: result.created ? 'User followed successfully' : 'Already following this user',
            data: { follow: result.follow }
        });
    } catch (error) {
        logger.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: error instanceof Error ? error.message : 'Failed to follow user'
        });
    }
};

