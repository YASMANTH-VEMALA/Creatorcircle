import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const createRoomSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    isPrivate: z.boolean().optional(),
    password: z.string().optional(),
    logoUrl: z.string().url().optional(),
    isTemporary: z.boolean().optional(),
    endsAt: z.string().datetime().optional()
});

/**
 * Create room
 * POST /api/v1/rooms
 */
export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createRoomSchema.parse(req.body);
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

        const room = await mg.Room.createRoom(currentUser._id, validatedData.name, {
            description: validatedData.description,
            isPrivate: validatedData.isPrivate,
            password: validatedData.password,
            logoUrl: validatedData.logoUrl,
            isTemporary: validatedData.isTemporary,
            endsAt: validatedData.endsAt ? new Date(validatedData.endsAt) : undefined
        });

        logger.info(`Room created: ${room._id} by user ${uid}`);

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
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

        logger.error('Create room error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create room'
        });
    }
};
