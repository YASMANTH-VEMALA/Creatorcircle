import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as commentController from '../controllers/comment';

const router = Router();

// Update comment
router.put('/:id', authenticate_user, commentController.updateComment);

// Delete comment
router.delete('/:id', authenticate_user, commentController.deleteComment);

// Like/Unlike comment
router.post('/:id/like', authenticate_user, commentController.toggleLike);

// Get comment replies
router.get('/:id/replies', commentController.getCommentReplies);

export default router;
