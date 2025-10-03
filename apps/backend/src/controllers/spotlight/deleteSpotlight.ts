import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Delete spotlight post
 * DELETE /api/v1/spotlight/:id
 */
export const deleteSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
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

        const spotlight = await mg.SpotlightPost.findById(id);
        if (!spotlight || spotlight.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Spotlight post not found'
            });
            return;
        }

        // Check ownership
        if (!spotlight.creatorId.equals(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only delete your own spotlight posts'
            });
            return;
        }

        // Soft delete
        spotlight.isDeleted = true;
        await spotlight.save();

        logger.info(`Spotlight deleted: ${spotlight._id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Spotlight post deleted successfully'
        });
    } catch (error) {
        logger.error('Delete spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete spotlight post'
        });
    }
};

