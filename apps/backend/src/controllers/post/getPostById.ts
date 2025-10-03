import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get post by ID
 * GET /api/v1/posts/:id
 */
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const post = await mg.Post.findById(id)
            .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge');

        if (!post || post.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Post not found'
            });
            return;
        }

        // Increment view count
        await post.incrementMetric('views');

        res.status(200).json({
            success: true,
            data: { post }
        });
    } catch (error) {
        logger.error('Get post by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get post'
        });
    }
};

