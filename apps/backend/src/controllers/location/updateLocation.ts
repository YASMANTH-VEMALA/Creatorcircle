import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const updateLocationSchema = z.object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90)
});

/**
 * Update user location
 * POST /api/v1/locations
 */
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = updateLocationSchema.parse(req.body);
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

        const location = await mg.UserLocation.updateUserLocation(
            currentUser._id,
            validatedData.longitude,
            validatedData.latitude,
            {
                displayName: currentUser.name,
                college: currentUser.college,
                skills: currentUser.skills,
                interests: currentUser.interests,
                verified: currentUser.isVerified,
                photoURL: currentUser.profilePhotoUrl
            }
        );

        logger.info(`Location updated for user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
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

        logger.error('Update location error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update location'
        });
    }
};

