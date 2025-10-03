import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as messageController from '../controllers/message';

const router = Router();

// Get messages for a chat
router.get('/chat/:chatId', authenticate_user, messageController.getChatMessages);

// Send message
router.post('/chat/:chatId', authenticate_user, messageController.sendMessage);

// Edit message
router.put('/:id', authenticate_user, messageController.editMessage);

// Delete message
router.delete('/:id', authenticate_user, messageController.deleteMessage);

// Mark message as seen
router.post('/:id/seen', authenticate_user, messageController.markMessageAsSeen);

export default router;
