import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as collaborationController from '../controllers/collaboration';

const router = Router();

// ==================== COLLABORATION ROUTES ====================

// Get collaboration requests (received/sent)
router.get('/', authenticate_user, collaborationController.getCollaborations);

// Send collaboration request
router.post('/', authenticate_user, collaborationController.sendRequest);

// Accept collaboration request
router.put('/:id/accept', authenticate_user, collaborationController.acceptRequest);

// Reject collaboration request
router.put('/:id/reject', authenticate_user, collaborationController.rejectRequest);

// Cancel collaboration request
router.delete('/:id', authenticate_user, collaborationController.cancelRequest);

export default router;

