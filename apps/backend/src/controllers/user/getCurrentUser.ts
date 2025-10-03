import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        const user = await mg.User.findOne({ uid });

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user'
        });
    }
};

