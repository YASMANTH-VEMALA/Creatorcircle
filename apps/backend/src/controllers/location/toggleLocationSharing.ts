import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const toggleSharingSchema = z.object({
    enabled: z.boolean()
});

/**
 * Toggle location sharing
 * PUT /api/v1/locations/sharing
 */
export const toggleLocationSharing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = toggleSharingSchema.parse(req.body);
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
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

        let location;
        if (validatedData.enabled) {
            location = await mg.UserLocation.enableSharing(currentUser._id);
        } else {
            location = await mg.UserLocation.disableSharing(currentUser._id);
        }

        if (!location) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Location not found. Please update your location first.'
            });
            return;
        }

        // Update user preferences
        currentUser.preferences.locationSharing = validatedData.enabled;
        await currentUser.save();

        logger.info(`Location sharing ${validatedData.enabled ? 'enabled' : 'disabled'} for user ${uid}`);

        res.status(200).json({
            success: true,
            message: `Location sharing ${validatedData.enabled ? 'enabled' : 'disabled'} successfully`,
            data: { location }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Invalid request data',
                errors: error.issues
            });
            return;
        }

        logger.error('Toggle location sharing error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to toggle location sharing'
        });
    }
};

