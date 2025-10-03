import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const createPostSchema = z.object({
    content: z.string().min(1).max(5000),
    emoji: z.string().max(10).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    videos: z.array(z.string().url()).max(3).optional()
});

/**
 * Create a new post
 * POST /api/v1/posts
 */
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createPostSchema.parse(req.body);
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

        const post = await mg.Post.create({
            userId: currentUser._id,
            content: validatedData.content,
            emoji: validatedData.emoji,
            images: validatedData.images || [],
            videos: validatedData.videos || []
        });

        logger.info(`Post created: ${post._id} by user ${uid}`);

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: { post }
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

        logger.error('Create post error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create post'
        });
    }
};
