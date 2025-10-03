import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get post shares count
 * GET /api/v1/posts/:id/shares
 */
export const getPostShares = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const post = await mg.Post.findById(id);
        if (!post || post.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Post not found'
            });
            return;
        }

        // Get all posts that shared this post
        const sharedPosts = await mg.Post.find({
            sharedPostId: post._id,
            isDeleted: false
        })
            .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();

        res.status(200).json({
            success: true,
            data: {
                sharesCount: post.shares || 0,
                sharedBy: sharedPosts,
                post: {
                    _id: post._id,
                    content: post.content
                }
            }
        });
    } catch (error) {
        logger.error('Get post shares error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get post shares'
        });
    }
};

