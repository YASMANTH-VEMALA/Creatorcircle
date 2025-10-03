import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get users by college
 * GET /api/v1/users/college/:college?page=1&limit=20
 */
export const getUsersByCollege = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { college } = req.params;
        const { limit = 20 } = req.query;

        const limitNum = parseInt(limit as string);

        const users = await mg.User.findByCollege(college, limitNum);

        res.status(200).json({
            success: true,
            data: { users }
        });
    } catch (error) {
        logger.error('Get users by college error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get users'
        });
    }
};

