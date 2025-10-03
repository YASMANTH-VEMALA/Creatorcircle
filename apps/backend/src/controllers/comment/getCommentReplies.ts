import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Get comment replies
 * GET /api/v1/comments/:id/replies?page=1&limit=20
 */
export const getCommentReplies = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        const replies = await mg.Comment.find({ replyToCommentId: new Types.ObjectId(id) })
            .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: {
                replies,
                pagination: {
                    page: pageNum,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        logger.error('Get comment replies error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get comment replies'
        });
    }
};
