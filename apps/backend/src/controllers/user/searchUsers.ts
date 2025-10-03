import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Search users
 * GET /api/v1/users/search?q=query&page=1&limit=20
 */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({
                success: false,
                error: 'BadRequest',
                message: 'Search query is required'
            });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        const users = await mg.User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { college: { $regex: q, $options: 'i' } },
                { passion: { $regex: q, $options: 'i' } },
                { skills: { $in: [new RegExp(q, 'i')] } },
                { interests: { $in: [new RegExp(q, 'i')] } }
            ]
        })
            .select('name college profilePhotoUrl isVerified verifiedBadge passion skills interests')
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .sort({ 'stats.followersCount': -1 });

        const total = await mg.User.countDocuments({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { college: { $regex: q, $options: 'i' } },
                { passion: { $regex: q, $options: 'i' } }
            ]
        });

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        logger.error('Search users error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to search users'
        });
    }
};

