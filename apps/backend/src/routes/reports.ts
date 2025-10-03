import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as reportController from '../controllers/report';

const router = Router();

// ==================== REPORT ROUTES ====================

// Get reports (admin)
router.get('/', authenticate_user, reportController.getReports);

// Create report
router.post('/', authenticate_user, reportController.createReport);

// Review report (admin)
router.put('/:id/review', authenticate_user, reportController.reviewReport);

// Resolve report (admin)
router.put('/:id/resolve', authenticate_user, reportController.resolveReport);

// Dismiss report (admin)
router.put('/:id/dismiss', authenticate_user, reportController.dismissReport);

export default router;

