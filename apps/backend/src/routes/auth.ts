import express from 'express';
import { register } from '../controllers/auth/register';
import { login } from '../controllers/auth/login';
import { login_with_google } from '../controllers/auth/google-auth';


import { authenticate_user } from '../middleware/auth';


const router = express.Router();


router.post('/register', register);
router.post('/google-auth', login_with_google);

router.use(authenticate_user);
router.post('/login', login);




export const authRoutes = router;