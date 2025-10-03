import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const dismissReportSchema = z.object({
    reason: z.string().min(1).max(500)
});

/**
 * Dismiss report (admin)
 * PUT /api/v1/reports/:id/dismiss
 */
export const dismissReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = dismissReportSchema.parse(req.body);
        const uid = req.user?.uid;

        if (!uid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
            return;
        }

        const currentUser = await mg.User.findOne({ uid });
        if (!currentUser) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        // TODO: Add admin check
        // if (!currentUser.isAdmin) { return 403 }

        const report = await mg.Report.findById(id);
        if (!report) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'Report not found'
            });
            return;
        }

        await report.dismiss(currentUser._id, validatedData.reason);

        logger.info(`Report dismissed: ${id} by admin ${uid}`);

        res.status(200).json({
            success: true,
            message: 'Report dismissed',
            data: { report }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'ValidationError',
                message: 'Invalid request data',
                errors: error.issues
            });
            return;
        }

        logger.error('Dismiss report error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to dismiss report'
        });
    }
};

