import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as postController from '../controllers/post';

const router = Router();

// ==================== POST ROUTES ====================

// Get feed (authenticated)
router.get('/feed', authenticate_user, postController.getFeed);

// Get trending posts (public)
router.get('/trending', postController.getTrendingPosts);

// Get user's posts (public)
router.get('/user/:userId', postController.getUserPosts);

// Create post
router.post('/', authenticate_user, postController.createPost);

// Get post by ID (increments view count)
router.get('/:id', authenticate_user, postController.getPostById);

// Update post
router.put('/:id', authenticate_user, postController.updatePost);

// Delete post
router.delete('/:id', authenticate_user, postController.deletePost);

// Like/Unlike post
router.post('/:id/like', authenticate_user, postController.toggleLike);

// Add reaction to post
router.post('/:id/reactions', authenticate_user, postController.addReaction);

// Get post comments
router.get('/:id/comments', postController.getPostComments);

// Create comment on post
router.post('/:id/comments', authenticate_user, postController.createComment);

// ==================== SHARE ROUTES ====================
import * as shareController from '../controllers/share';

// Share post
router.post('/:id/share', authenticate_user, shareController.sharePost);

// Get post shares
router.get('/:id/shares', shareController.getPostShares);

export default router;
