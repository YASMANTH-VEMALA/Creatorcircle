import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Like/Unlike spotlight post
 * POST /api/v1/spotlight/:id/like
 */
export const toggleLikeSpotlight = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Check if like already exists
        const existingLike = await mg.Like.findOne({
            userId: currentUser._id,
            targetId: spotlight._id,
            targetType: 'spotlight'
        });

        let isLiked: boolean;

        if (existingLike) {
            // Unlike
            await existingLike.deleteOne();
            await spotlight.incrementMetric('likesCount', -1);
            isLiked = false;
            logger.info(`Spotlight unliked: ${spotlight._id} by user ${uid}`);
        } else {
            // Like
            await mg.Like.create({
                userId: currentUser._id,
                targetId: spotlight._id,
                targetType: 'spotlight'
            });
            await spotlight.incrementMetric('likesCount', 1);
            isLiked = true;
            logger.info(`Spotlight liked: ${spotlight._id} by user ${uid}`);

            // Create notification for spotlight creator
            if (!spotlight.creatorId.equals(currentUser._id)) {
                await mg.Notification.createNotification(
                    'like',
                    spotlight.creatorId,
                    `${currentUser.name} liked your spotlight`,
                    {
                        fromUserId: currentUser._id,
                        senderName: currentUser.name,
                        senderProfilePic: currentUser.profilePhotoUrl,
                        senderVerified: currentUser.isVerified,
                        relatedPostId: spotlight._id
                    }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: isLiked ? 'Spotlight liked successfully' : 'Spotlight unliked successfully',
            data: {
                isLiked,
                likesCount: spotlight.likesCount
            }
        });
    } catch (error) {
        logger.error('Toggle like spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to toggle like on spotlight post'
        });
    }
};

