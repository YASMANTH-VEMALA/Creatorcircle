import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { Types } from 'mongoose';

const createReportSchema = z.object({
    targetType: z.enum(['post', 'comment', 'user', 'spotlight']),
    targetId: z.string(),
    reason: z.enum(['spam', 'offensive', 'fake', 'inappropriate', 'harassment', 'other']),
    description: z.string().max(1000).optional()
});

/**
 * Create report
 * POST /api/v1/reports
 */
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createReportSchema.parse(req.body);
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

        const targetId = new Types.ObjectId(validatedData.targetId);

        const report = await mg.Report.createReport(
            currentUser._id,
            validatedData.targetType,
            targetId,
            validatedData.reason,
            validatedData.description
        );

        logger.info(`Report created: ${report._id} by user ${uid} for ${validatedData.targetType} ${validatedData.targetId}`);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. We will review it soon.',
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

        logger.error('Create report error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to create report'
        });
    }
};

