import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get spotlight post by ID
 * GET /api/v1/spotlight/:id
 */
export const getSpotlightById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const spotlight = await mg.SpotlightPost.findById(id)
            .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge');

        if (!spotlight || spotlight.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Spotlight post not found'
            });
            return;
        }

        // Increment views count
        await spotlight.incrementMetric('viewsCount');

        res.status(200).json({
            success: true,
            data: { spotlight }
        });
    } catch (error) {
        logger.error('Get spotlight by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get spotlight post'
        });
    }
};

