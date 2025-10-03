import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import mg from '../../config/models';
import { logger } from '../../utils/logger';

/**
 * Get collaboration requests (received)
 * GET /api/v1/collaborations
 */
export const getCollaborations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const status = req.query.status as 'pending' | 'accepted' | 'rejected' | undefined;
        const type = req.query.type as 'received' | 'sent' || 'received';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

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

        const requests = type === 'sent'
            ? await mg.CollaborationRequest.getSentRequests(currentUser._id, status, page, limit)
            : await mg.CollaborationRequest.getReceivedRequests(currentUser._id, status, page, limit);

        res.status(200).json({
            success: true,
            data: {
                requests,
                page,
                limit,
                hasMore: requests.length === limit
            }
        });
    } catch (error) {
        logger.error('Get collaborations error:', error);
        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to get collaboration requests'
        });
    }
};

