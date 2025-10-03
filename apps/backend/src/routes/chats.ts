import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as chatController from '../controllers/chat';

const router = Router();

// Get user's chats
router.get('/', authenticate_user, chatController.getUserChats);

// Get chat by ID
router.get('/:id', authenticate_user, chatController.getChatById);

// Create direct chat
router.post('/direct', authenticate_user, chatController.createDirectChat);

// Create group chat
router.post('/group', authenticate_user, chatController.createGroupChat);

// Update chat
router.put('/:id', authenticate_user, chatController.updateChat);

// Delete chat
router.delete('/:id', authenticate_user, chatController.deleteChat);

// Archive chat
router.post('/:id/archive', authenticate_user, chatController.archiveChat);

// Unarchive chat
router.delete('/:id/archive', authenticate_user, chatController.unarchiveChat);

// Mute chat
router.post('/:id/mute', authenticate_user, chatController.muteChat);

// Unmute chat
router.delete('/:id/mute', authenticate_user, chatController.unmuteChat);

// Add member to group
router.post('/:id/members', authenticate_user, chatController.addMember);

// Remove member from group
router.delete('/:id/members/:userId', authenticate_user, chatController.removeMember);

export default router;
