import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Search posts
 * GET /api/v1/search/posts
 */
export const searchPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const sortBy = req.query.sortBy as string || 'relevance'; // relevance, recent, popular

        if (!query || query.trim().length < 2) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Search query must be at least 2 characters'
            });
            return;
        }

        const searchRegex = new RegExp(query, 'i');

        let sortOptions: any = {};
        switch (sortBy) {
            case 'recent':
                sortOptions = { createdAt: -1 };
                break;
            case 'popular':
                sortOptions = { likes: -1, comments: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 }; // Default to recent
        }

        const posts = await mg.Post.find({
            content: searchRegex,
            isDeleted: false
        })
            .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const totalCount = await mg.Post.countDocuments({
            content: searchRegex,
            isDeleted: false
        });

        logger.info(`Post search performed: "${query}"`);

        res.status(200).json({
            success: true,
            data: {
                query,
                posts,
                page,
                limit,
                totalCount,
                hasMore: posts.length === limit
            }
        });
    } catch (error) {
        logger.error('Search posts error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to search posts'
        });
    }
};

