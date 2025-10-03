import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as roomController from '../controllers/room';
import * as roomMessageController from '../controllers/room-message';

const router = Router();

// ==================== ROOM ROUTES ====================

// Get public rooms
router.get('/', roomController.getPublicRooms);

// Get user's rooms
router.get('/my', authenticate_user, roomController.getUserRooms);

// Create room
router.post('/', authenticate_user, roomController.createRoom);

// Get room by ID
router.get('/:id', roomController.getRoomById);

// Update room
router.put('/:id', authenticate_user, roomController.updateRoom);

// Delete room
router.delete('/:id', authenticate_user, roomController.deleteRoom);

// Join room
router.post('/:id/join', authenticate_user, roomController.joinRoom);

// Leave room
router.delete('/:id/leave', authenticate_user, roomController.leaveRoom);

// Make user admin
router.post('/:id/members/:userId/admin', authenticate_user, roomController.makeAdmin);

// Remove admin privileges
router.delete('/:id/members/:userId/admin', authenticate_user, roomController.removeAdmin);

// ==================== ROOM MESSAGE ROUTES ====================

// Get room messages
router.get('/:roomId/messages', authenticate_user, roomMessageController.getRoomMessages);

// Send room message
router.post('/:roomId/messages', authenticate_user, roomMessageController.sendRoomMessage);

export default router;

