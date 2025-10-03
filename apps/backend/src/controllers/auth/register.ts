import { Request, Response } from 'express';
import { z } from 'zod';
import mg from '../../config/models';
import { throw_error } from '../../utils/error-handler';
import admin from '../../config/firebase';
import { TUserData } from './login';
import { logger } from '../../utils/logger';

const z_register_req_body = z.object({
    name: z.string().min(1, 'name is required').optional(),
});

/**
 * User registration controller
 * POST /api/v1/auth/register
 * 
 * Registers a new user with Firebase authentication
 */
export const register = async (req: Request, res: Response): Promise<void> => {
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

        const { name } = z_register_req_body.parse(req.body);

        const decoded_token = await admin.auth().verifyIdToken(token);

        if (!decoded_token.uid || !decoded_token.email) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Token is invalid'
            });
            return;
        }

        const existing_user = await mg.User.findOne({ uid: decoded_token.uid });

        if (existing_user) {
            res.status(409).json({
                success: false,
                error: 'Conflict',
                message: `User with email ${decoded_token.email} already exists. Please login instead.`
            });
            return;
        }

        const newUser = await mg.User.create({
            uid: decoded_token.uid,
            email: decoded_token.email,
            name: name || decoded_token.name || decoded_token.email?.split('@')[0] || 'User',
            college: 'Not specified',
            passion: '',
            aboutMe: '',
            skills: [],
            interests: [],
            profilePhotoUrl: '',
            joinedDate: new Date(),
        });

        if (!newUser) {
            res.status(500).json({
                success: false,
                error: 'InternalServerError',
                message: 'Failed to create new user'
            });
            return;
        }

        const userData: TUserData = {
            _id: newUser._id,
            uid: newUser.uid,
            email: newUser.email,
            name: newUser.name,
            college: newUser.college,
            passion: newUser.passion,
            aboutMe: newUser.aboutMe,
            profilePhotoUrl: newUser.profilePhotoUrl,
            bannerPhotoUrl: newUser.bannerPhotoUrl,
            skills: newUser.skills,
            interests: newUser.interests,
            isVerified: newUser.isVerified,
            verifiedBadge: newUser.verifiedBadge,
            isPremium: newUser.isPremium,
            premiumExpiry: newUser.premiumExpiry,
            lastLogin: newUser.createdAt,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        };

        logger.info(`User registered successfully: ${newUser.uid} - ${newUser.email}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: userData,
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

        logger.error('Registration error:', error);

        res.status(500).json({
            success: false,
            error: 'InternalServerError',
            message: 'Failed to register user'
        });
    }
};

