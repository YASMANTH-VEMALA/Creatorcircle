import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as uploadController from '../controllers/upload';

const router = Router();

// ==================== UPLOAD ROUTES ====================

// Upload image
router.post('/image', authenticate_user, uploadController.uploadImage);

// Upload video
router.post('/video', authenticate_user, uploadController.uploadVideo);

// Upload file
router.post('/file', authenticate_user, uploadController.uploadFile);

// Delete uploaded file
router.delete('/:fileId', authenticate_user, uploadController.deleteFile);

export default router;

