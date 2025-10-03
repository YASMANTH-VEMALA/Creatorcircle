import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as notificationController from '../controllers/notification';

const router = Router();

// Get user notifications
router.get('/', authenticate_user, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', authenticate_user, notificationController.getUnreadCount);

// Mark as read
router.put('/:id/read', authenticate_user, notificationController.markAsRead);

// Mark all as read
router.put('/read-all', authenticate_user, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticate_user, notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear-all', authenticate_user, notificationController.clearAllNotifications);

export default router;
