import { Request, Response } from 'express';
import mg from '../../config/models';
import { throw_error } from '../../utils/error-handler';
import { z } from 'zod';
import { TUserData } from './login';
import admin from '../../config/firebase';
import { logger } from '../../utils/logger';

/**
 * Google authentication controller
 * POST /api/v1/auth/google-auth
 * 
 * Handles Google OAuth login/registration
 * Creates new user if doesn't exist, otherwise logs in existing user
 */
export const login_with_google = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Token is missing'
            });
            return;
        }

        const decoded_token = await admin.auth().verifyIdToken(token);

        if (!decoded_token.uid || !decoded_token.email) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Token is invalid'
            });
            return;
        }

        logger.info(`Google auth attempt: ${decoded_token.uid} - ${decoded_token.email}`);

        let dbUser = await mg.User.findOne({ uid: decoded_token.uid });
        let isNewUser = false;

        if (!dbUser) {
            isNewUser = true;

            dbUser = await mg.User.create({
                uid: decoded_token.uid,
                name: decoded_token.name || decoded_token.email?.split('@')[0] || 'User',
                email: decoded_token.email,
                college: 'Not specified',
                passion: '',
                aboutMe: '',
                profilePhotoUrl: '',
                skills: [],
                interests: [],
                joinedDate: new Date(),
            });

            if (!dbUser) {
                res.status(500).json({
                    success: false,
                    error: 'InternalServerError',
                    message: 'Failed to create new user'
                });
                return;
            }

            logger.info(`New user created via Google auth: ${dbUser.uid}`);
        } else {
            // Update last activity for existing user
            dbUser.activity.lastActivityAt = new Date();
            dbUser.activity.lastLoginDate = new Date();
            dbUser.activity.totalSessions += 1;

            // Update streak
            if (typeof dbUser.updateStreak === 'function') {
                dbUser.updateStreak();
            }

            await dbUser.save();

            logger.info(`Existing user logged in via Google auth: ${dbUser.uid}`);
        }

        const user_data: TUserData = {
            _id: dbUser._id,
            uid: dbUser.uid,
            email: dbUser.email,
            name: dbUser.name,
            college: dbUser.college,
            passion: dbUser.passion,
            aboutMe: dbUser.aboutMe,
            profilePhotoUrl: dbUser.profilePhotoUrl,
            bannerPhotoUrl: dbUser.bannerPhotoUrl,
            skills: dbUser.skills,
            interests: dbUser.interests,
            isVerified: dbUser.isVerified,
            verifiedBadge: dbUser.verifiedBadge,
            isPremium: dbUser.isPremium,
            premiumExpiry: dbUser.premiumExpiry,
            lastLogin: dbUser.activity?.lastLoginDate || dbUser.updatedAt,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
        };

        res.status(200).json({
            success: true,
            message: isNewUser ? 'User registered successfully' : 'User logged in successfully',
            data: user_data,
            isNewUser,
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

        logger.error('Google auth error:', error);

        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to authenticate with Google'
        });
    }
};

