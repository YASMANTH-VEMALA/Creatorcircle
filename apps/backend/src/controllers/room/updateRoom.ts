import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const updateRoomSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
    isPrivate: z.boolean().optional()
});

/**
 * Update room
 * PUT /api/v1/rooms/:id
 */
export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateRoomSchema.parse(req.body);
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

        // Check if user is admin
        if (!room.isAdmin(currentUser._id)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only room admins can update the room'
            });
            return;
        }

        // Update fields
        if (validatedData.name) room.name = validatedData.name;
        if (validatedData.description !== undefined) room.description = validatedData.description;
        if (validatedData.logoUrl !== undefined) room.logoUrl = validatedData.logoUrl;
        if (validatedData.isPrivate !== undefined) room.isPrivate = validatedData.isPrivate;

        await room.save();

        logger.info(`Room updated: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: { room }
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

        logger.error('Update room error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to update room'
        });
    }
};
