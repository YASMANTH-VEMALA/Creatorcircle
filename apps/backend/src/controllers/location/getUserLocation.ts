import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get user location
 * GET /api/v1/locations/:userId
 */
export const getUserLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        const targetUser = await mg.User.findById(userId);
        if (!targetUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        const location = await mg.UserLocation.getUserLocation(targetUser._id);

        if (!location) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Location not found for this user'
            });
            return;
        }

        // Check if location sharing is enabled
        if (!location.isLocationShared) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'This user has disabled location sharing'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { location }
        });
    } catch (error) {
        logger.error('Get user location error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get user location'
        });
    }
};

