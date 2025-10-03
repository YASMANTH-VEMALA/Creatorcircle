import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get all spotlight posts (feed)
 * GET /api/v1/spotlight
 */
export const getAllSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const spotlights = await mg.SpotlightPost.getFeed(page, limit);

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
        logger.error('Get all spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get spotlight posts'
        });
    }
};

