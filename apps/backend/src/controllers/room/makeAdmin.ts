import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Make user admin
 * POST /api/v1/rooms/:id/members/:userId/admin
 */
export const makeAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, userId } = req.params;
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

        const room = await mg.Room.findById(id);
        if (!room || !room.isActive) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Room not found'
            });
            return;
        }

        // Check if current user is admin
        if (!room.isAdmin(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only room admins can make members admin'
            });
            return;
        }

        const memberToPromoteId = new Types.ObjectId(userId);
        await room.addAdmin(memberToPromoteId);

        logger.info(`User ${userId} made admin in room ${id} by ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Member promoted to admin successfully',
            data: { room }
        });
    } catch (error) {
        logger.error('Make admin error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to make member admin'
        });
    }
};
