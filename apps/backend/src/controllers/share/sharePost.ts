import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const sharePostSchema = z.object({
    caption: z.string().max(500).optional()
});

/**
 * Share a post
 * POST /api/v1/posts/:id/share
 */
export const sharePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = sharePostSchema.parse(req.body);
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

        const originalPost = await mg.Post.findById(id);
        if (!originalPost || originalPost.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Post not found'
            });
            return;
        }

        // Create a new post as a share
        const sharedPost = await mg.Post.create({
            userId: currentUser._id,
            content: validatedData.caption || `Shared a post by ${originalPost.userId}`,
            sharedPostId: originalPost._id,
            isShared: true
        });

        // Increment shares count on original post
        originalPost.shares = (originalPost.shares || 0) + 1;
        await originalPost.save();

        logger.info(`Post shared: ${id} by user ${uid}`);

        // Create notification for original post creator
        if (!originalPost.userId.equals(currentUser._id)) {
            await mg.Notification.createNotification(
                'like', // Using 'like' type as placeholder, you may want to add 'share' type
                originalPost.userId,
                `${currentUser.name} shared your post`,
                {
                    fromUserId: currentUser._id,
                    senderName: currentUser.name,
                    senderProfilePic: currentUser.profilePhotoUrl,
                    senderVerified: currentUser.isVerified,
                    relatedPostId: originalPost._id
                }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            data: {
                sharedPost,
                originalPost
            }
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

        logger.error('Share post error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to share post'
        });
    }
};

