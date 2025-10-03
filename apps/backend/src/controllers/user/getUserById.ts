import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await mg.User.findById(id).select('-aiApiKey');

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
        logger.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user'
        });
    }
};

