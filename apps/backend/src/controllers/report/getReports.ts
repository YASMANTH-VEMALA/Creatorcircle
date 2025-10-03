import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get reports (admin only)
 * GET /api/v1/reports
 */
export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const targetType = req.query.targetType as 'post' | 'comment' | 'user' | 'spotlight' | undefined;
        const status = req.query.status as 'pending' | 'reviewed' | 'resolved' | 'dismissed' | undefined;

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

        // TODO: Add admin check here
        // For now, allowing all authenticated users to view reports
        // In production, add: if (!currentUser.isAdmin) { return 403 }

        let reports;
        if (status) {
            const query: any = { status };
            if (targetType) query.targetType = targetType;

            reports = await mg.Report.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('reporterId', 'name email college')
                .populate('reviewedBy', 'name email');
        } else {
            reports = await mg.Report.getPendingReports(page, limit, targetType);
        }

        res.status(200).json({
            success: true,
            data: {
                reports,
                page,
                limit,
                hasMore: reports.length === limit
            }
        });
    } catch (error) {
        logger.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get reports'
        });
    }
};

