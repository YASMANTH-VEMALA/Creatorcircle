import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as locationController from '../controllers/location';

const router = Router();

// ==================== LOCATION ROUTES ====================

// Get nearby creators
router.get('/nearby', authenticate_user, locationController.getNearbyCreators);

// Update location
router.post('/', authenticate_user, locationController.updateLocation);

// Toggle location sharing
router.put('/sharing', authenticate_user, locationController.toggleLocationSharing);

// Get user location
router.get('/:userId', authenticate_user, locationController.getUserLocation);

export default router;

