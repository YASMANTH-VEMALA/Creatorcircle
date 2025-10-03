import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as roomMessageController from '../controllers/room-message';

const router = Router();

// ==================== ROOM MESSAGE ROUTES ====================

// Delete room message
router.delete('/:id', authenticate_user, roomMessageController.deleteRoomMessage);

export default router;

