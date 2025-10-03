import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Global search (users, posts, rooms)
 * GET /api/v1/search/all
 */
export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!query || query.trim().length < 2) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Search query must be at least 2 characters'
            });
            return;
        }

        const searchRegex = new RegExp(query, 'i');

        // Search users
        const users = await mg.User.find({
            $or: [
                { name: searchRegex },
                { college: searchRegex },
                { passion: searchRegex }
            ]
        })
            .select('name college profilePhotoUrl isVerified verifiedBadge')
            .limit(limit)
            .exec();

        // Search posts
        const posts = await mg.Post.find({
            content: searchRegex,
            isDeleted: false
        })
            .populate('userId', 'name profilePhotoUrl')
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();

        // Search rooms
        const rooms = await mg.Room.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex }
            ],
            isActive: true,
            isPrivate: false
        })
            .populate('creatorId', 'name profilePhotoUrl')
            .limit(limit)
            .exec();

        // Search spotlight posts
        const spotlights = await mg.SpotlightPost.find({
            caption: searchRegex,
            isDeleted: false,
            isPublic: true
        })
            .populate('creatorId', 'name profilePhotoUrl')
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();

        logger.info(`Global search performed: "${query}"`);

        res.status(200).json({
            success: true,
            data: {
                query,
                results: {
                    users,
                    posts,
                    rooms,
                    spotlights
                },
                counts: {
                    users: users.length,
                    posts: posts.length,
                    rooms: rooms.length,
                    spotlights: spotlights.length,
                    total: users.length + posts.length + rooms.length + spotlights.length
                }
            }
        });
    } catch (error) {
        logger.error('Global search error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to perform search'
        });
    }
};

