import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

/**
 * Delete post
 * DELETE /api/v1/posts/:id
 */
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const post = await mg.Post.findById(id);
        if (!post || post.isDeleted) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Post not found'
            });
            return;
        }

        if (!post.userId.equals(currentUser._id as Types.ObjectId)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only delete your own posts'
            });
            return;
        }

        // Soft delete
        post.isDeleted = true;
        await post.save();

        logger.info(`Post deleted: ${id} by user ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        logger.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to delete post'
        });
    }
};

