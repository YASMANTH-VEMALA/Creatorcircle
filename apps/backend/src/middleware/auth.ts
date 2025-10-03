import { Response, NextFunction, Request } from 'express';
import mg from '../config/models';
import { ObjectId } from 'mongodb';
import { throw_error } from '../utils/error-handler';
import admin from '../config/firebase';

export type TAuthMiddleware = Request & {
    user?: {
        firebaseUid: string;
        userId: ObjectId;
        email: string;
        userType?: string;
        uid?: string;
    };
};

// Export as AuthRequest for compatibility with existing controllers
export type AuthRequest = TAuthMiddleware;

const authenticate_user = async (req: TAuthMiddleware, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw_error({ message: 'Token is missing', status_code: 401 });
        return;
    }

    const decoded_token = await admin.auth().verifyIdToken(token);

    if (!decoded_token.uid || !decoded_token.email) {
        throw_error({ message: 'Token is invalid', status_code: 401 });
        return;
    }

    const db_user = await mg.User.findOne<{ _id: ObjectId, userType?: string }>({ uid: decoded_token.uid })
    if (!db_user) {
        throw_error({ message: 'User not found', status_code: 401 });
        return;
    }


    req.user = {
        firebaseUid: decoded_token.uid,
        uid: decoded_token.uid,
        userId: db_user._id,
        email: decoded_token.email,
        userType: db_user.userType,
    };

    next();


}

export { authenticate_user };