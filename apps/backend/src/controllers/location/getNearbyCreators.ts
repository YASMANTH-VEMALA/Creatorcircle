import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get nearby creators
 * GET /api/v1/locations/nearby
 */
export const getNearbyCreators = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const longitude = parseFloat(req.query.longitude as string);
        const latitude = parseFloat(req.query.latitude as string);
        const maxDistance = parseInt(req.query.maxDistance as string) || 50000; // 50km default
        const limit = parseInt(req.query.limit as string) || 50;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        if (isNaN(longitude) || isNaN(latitude)) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Valid longitude and latitude are required'
            });
            return;
        }

        const currentUser = await mg.User.findOne({ uid });
        if (!currentUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        const nearbyUsers = await mg.UserLocation.findNearby(
            longitude,
            latitude,
            maxDistance,
            limit,
            currentUser._id
        );

        res.status(200).json({
            success: true,
            data: {
                nearbyUsers,
                count: nearbyUsers.length
            }
        });
    } catch (error) {
        logger.error('Get nearby creators error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get nearby creators'
        });
    }
};

