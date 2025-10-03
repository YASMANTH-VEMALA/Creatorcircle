import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get suggested users to follow
 * GET /api/v1/users/suggested
 */
export const getSuggestedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
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

        // Get users the current user is already following
        const following = await mg.Follow.find({ followerId: currentUser._id })
            .select('followingId')
            .exec();
        const followingIds = following.map(f => f.followingId);

        // Build suggestion criteria
        const suggestionCriteria: any = {
            _id: { $ne: currentUser._id, $nin: followingIds }
        };

        // Priority 1: Same college
        if (currentUser.college) {
            suggestionCriteria.college = currentUser.college;
        }

        let suggestions = await mg.User.find(suggestionCriteria)
            .select('name college profilePhotoUrl isVerified verifiedBadge skills interests stats')
            .sort({ 'stats.followersCount': -1 })
            .limit(limit)
            .exec();

        // If not enough suggestions from same college, add users with similar interests
        if (suggestions.length < limit && currentUser.interests.length > 0) {
            const remainingLimit = limit - suggestions.length;
            const existingSuggestionIds = suggestions.map(s => s._id);

            const similarInterests = await mg.User.find({
                _id: { $ne: currentUser._id, $nin: [...followingIds, ...existingSuggestionIds] },
                interests: { $in: currentUser.interests }
            })
                .select('name college profilePhotoUrl isVerified verifiedBadge skills interests stats')
                .sort({ 'stats.followersCount': -1 })
                .limit(remainingLimit)
                .exec();

            suggestions = [...suggestions, ...similarInterests];
        }

        // If still not enough, add popular users
        if (suggestions.length < limit) {
            const remainingLimit = limit - suggestions.length;
            const existingSuggestionIds = suggestions.map(s => s._id);

            const popularUsers = await mg.User.find({
                _id: { $ne: currentUser._id, $nin: [...followingIds, ...existingSuggestionIds] }
            })
                .select('name college profilePhotoUrl isVerified verifiedBadge skills interests stats')
                .sort({ 'stats.followersCount': -1 })
                .limit(remainingLimit)
                .exec();

            suggestions = [...suggestions, ...popularUsers];
        }

        logger.info(`Suggested users fetched for user ${uid}: ${suggestions.length} suggestions`);

        res.status(200).json({
            success: true,
            data: {
                suggestions,
                count: suggestions.length
            }
        });
    } catch (error) {
        logger.error('Get suggested users error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get suggested users'
        });
    }
};

