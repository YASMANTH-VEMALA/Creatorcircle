import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Get post comments
 * GET /api/v1/posts/:id/comments?page=1&limit=20
 */
export const getPostComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        const comments = await mg.Comment.getPostComments(
            new Types.ObjectId(id),
            pageNum,
            limitNum
        );

        res.status(200).json({
            success: true,
            data: {
                comments,
                pagination: {
                    page: pageNum,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        logger.error('Get post comments error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get comments'
        });
    }
};

