import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get mutual followers
 * GET /api/v1/users/:id/mutual-followers
 */
export const getMutualFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const uid = req.user?.uid;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

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

        const targetUser = await mg.User.findById(id);
        if (!targetUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Target user not found'
            });
            return;
        }

        // Get followers of current user
        const currentUserFollowers = await mg.Follow.find({ followingId: currentUser._id })
            .select('followerId')
            .exec();
        const currentUserFollowerIds = currentUserFollowers.map(f => f.followerId.toString());

        // Get followers of target user
        const targetUserFollowers = await mg.Follow.find({ followingId: targetUser._id })
            .select('followerId')
            .exec();
        const targetUserFollowerIds = targetUserFollowers.map(f => f.followerId.toString());

        // Find mutual followers (users who follow both)
        const mutualFollowerIds = currentUserFollowerIds.filter(id =>
            targetUserFollowerIds.includes(id)
        );

        // Get user details for mutual followers
        const mutualFollowers = await mg.User.find({
            _id: { $in: mutualFollowerIds }
        })
            .select('name college profilePhotoUrl isVerified verifiedBadge stats')
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        logger.info(`Mutual followers fetched for users ${currentUser._id} and ${targetUser._id}`);

        res.status(200).json({
            success: true,
            data: {
                mutualFollowers,
                count: mutualFollowerIds.length,
                page,
                limit,
                hasMore: mutualFollowers.length === limit
            }
        });
    } catch (error) {
        logger.error('Get mutual followers error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get mutual followers'
        });
    }
};

