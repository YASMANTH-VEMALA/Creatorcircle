import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as spotlightController from '../controllers/spotlight';

const router = Router();

// Get all spotlight posts
router.get('/', spotlightController.getAllSpotlight);

// Get user spotlight posts
router.get('/user/:userId', spotlightController.getUserSpotlight);

// Create spotlight post
router.post('/', authenticate_user, spotlightController.createSpotlight);

// Get spotlight by ID
router.get('/:id', authenticate_user, spotlightController.getSpotlightById);

// Update spotlight
router.put('/:id', authenticate_user, spotlightController.updateSpotlight);

// Delete spotlight
router.delete('/:id', authenticate_user, spotlightController.deleteSpotlight);

// Like spotlight
router.post('/:id/like', authenticate_user, spotlightController.toggleLikeSpotlight);

// Comment on spotlight  
router.post('/:id/comments', authenticate_user, spotlightController.commentSpotlight);

// Get spotlight comments
router.get('/:id/comments', spotlightController.getSpotlightComments);

export default router;
