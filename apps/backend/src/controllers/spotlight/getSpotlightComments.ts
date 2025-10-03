import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get spotlight post comments
 * GET /api/v1/spotlight/:id/comments
 */
export const getSpotlightComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const spotlight = await mg.SpotlightPost.findById(id);
        if (!spotlight || spotlight.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Spotlight post not found'
            });
            return;
        }

        // Get comments (reusing Comment model's method)
        const comments = await mg.Comment.getPostComments(spotlight._id, page, limit);

        res.status(200).json({
            success: true,
            data: {
                comments,
                page,
                limit,
                hasMore: comments.length === limit
            }
        });
    } catch (error) {
        logger.error('Get spotlight comments error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get spotlight comments'
        });
    }
};

