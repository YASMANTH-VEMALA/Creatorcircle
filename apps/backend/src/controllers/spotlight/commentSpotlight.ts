import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const commentSpotlightSchema = z.object({
    content: z.string().min(1).max(1000)
});

/**
 * Comment on spotlight post
 * POST /api/v1/spotlight/:id/comment
 */
export const commentSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = commentSpotlightSchema.parse(req.body);
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

        // Create comment (reuse Comment model with spotlight reference)
        const comment = await mg.Comment.create({
            postId: spotlight._id, // Using postId field for spotlight as well
            userId: currentUser._id,
            content: validatedData.content
        });

        // Increment comments count
        await spotlight.incrementMetric('commentsCount', 1);

        logger.info(`Comment added to spotlight: ${spotlight._id} by user ${uid}`);

        // Create notification for spotlight creator
        if (!spotlight.creatorId.equals(currentUser._id)) {
            await mg.Notification.createNotification(
                'comment',
                spotlight.creatorId,
                `${currentUser.name} commented on your spotlight`,
                {
                    fromUserId: currentUser._id,
                    senderName: currentUser.name,
                    senderProfilePic: currentUser.profilePhotoUrl,
                    senderVerified: currentUser.isVerified,
                    relatedPostId: spotlight._id,
                    relatedCommentId: comment._id,
                    commentText: validatedData.content
                }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment }
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

        logger.error('Comment spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to comment on spotlight post'
        });
    }
};

