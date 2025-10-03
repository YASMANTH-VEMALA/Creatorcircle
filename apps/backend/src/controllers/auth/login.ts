import { Response } from 'express';
import mg from '../../config/models';
import { throw_error } from '../../utils/error-handler';
import { TAuthMiddleware } from '../../middleware/auth';
import { Types } from 'mongoose';
import { logger } from '../../utils/logger';

export type TUserData = {
    _id: Types.ObjectId;
    uid: string;
    email: string;
    name: string;
    college: string;
    passion: string;
    aboutMe: string;
    profilePhotoUrl: string;
    bannerPhotoUrl?: string;
    skills: string[];
    interests: string[];
    isVerified: boolean;
    verifiedBadge: 'none' | 'silver' | 'gold';
    isPremium: boolean;
    premiumExpiry?: Date;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * User login controller
 * POST /api/v1/auth/login
 * 
 * Handles user login by verifying Firebase authentication and updating user activity
 */
export const login = async (req: TAuthMiddleware, res: Response): Promise<void> => {
    try {
        const firebaseUser = req.user;

        if (!firebaseUser?.firebaseUid) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        // Find and update user's last activity
        const db_user = await mg.User.findOneAndUpdate(
            { uid: firebaseUser.firebaseUid },
            {
                $set: {
                    'activity.lastActivityAt': new Date(),
                    'activity.lastLoginDate': new Date(),
                    updatedAt: new Date()
                },
                $inc: { 'activity.totalSessions': 1 }
            },
            { new: true }
        );

        if (!db_user) {
            res.status(404).json({
                success: false,
                error: 'NotFound',
                message: 'User account does not exist. Please register first.'
            });
            return;
        }

        // Update streak (method defined in user model)
        if (typeof db_user.updateStreak === 'function') {
            db_user.updateStreak();
            await db_user.save();
        }

        // Prepare user data response
        const userData: TUserData = {
            _id: db_user._id,
            uid: db_user.uid,
            email: db_user.email,
            name: db_user.name,
            college: db_user.college,
            passion: db_user.passion,
            aboutMe: db_user.aboutMe,
            profilePhotoUrl: db_user.profilePhotoUrl,
            bannerPhotoUrl: db_user.bannerPhotoUrl,
            skills: db_user.skills,
            interests: db_user.interests,
            isVerified: db_user.isVerified,
            verifiedBadge: db_user.verifiedBadge,
            isPremium: db_user.isPremium,
            premiumExpiry: db_user.premiumExpiry,
            lastLogin: db_user.activity?.lastLoginDate || new Date(),
            createdAt: db_user.createdAt,
            updatedAt: db_user.updatedAt,
        };

        logger.info(`User logged in successfully: ${db_user.uid} - ${db_user.email}`);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: userData,
        });

    } catch (error) {
        // Log unexpected errors
        logger.error('Login error:', error);

        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to log in user'
        });
    }
};

