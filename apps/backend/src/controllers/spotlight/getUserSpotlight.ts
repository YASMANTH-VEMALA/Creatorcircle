import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user's spotlight posts
 * GET /api/v1/spotlight/user/:userId
 */
export const getUserSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const user = await mg.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        const spotlights = await mg.SpotlightPost.getCreatorSpotlights(user._id, page, limit);

        res.status(200).json({
            success: true,
            data: {
                spotlights,
                page,
                limit,
                hasMore: spotlights.length === limit
            }
        });
    } catch (error) {
        logger.error('Get user spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user spotlight posts'
        });
    }
};

