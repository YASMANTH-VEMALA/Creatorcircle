import { Router } from 'express';
import { authenticate_user } from '../middleware/auth';
import * as userController from '../controllers/user';

const router = Router();

// ==================== USER ROUTES ====================

// User registration
router.post('/register', authenticate_user, userController.registerUser);

// Get current user profile
router.get('/me', authenticate_user, userController.getCurrentUser);

// Update current user profile
router.put('/me', authenticate_user, userController.updateUser);

// Search users
router.get('/search', userController.searchUsers);

// Get leaderboard
router.get('/leaderboard', userController.getLeaderboard);

// Get user by ID
router.get('/:id', userController.getUserById);

// Get users by college
router.get('/college/:college', userController.getUsersByCollege);

// Follow/Unfollow user
router.post('/:id/follow', authenticate_user, userController.followUser);
router.delete('/:id/follow', authenticate_user, userController.unfollowUser);

// Get user followers and following
router.get('/:id/followers', userController.getUserFollowers);
router.get('/:id/following', userController.getUserFollowing);

// ==================== XP/GAMIFICATION ROUTES ====================
import * as xpController from '../controllers/xp';
import * as suggestionsController from '../controllers/suggestions';

// Get suggested users to follow
router.get('/suggested', authenticate_user, suggestionsController.getSuggestedUsers);

// Get mutual followers
router.get('/:id/mutual-followers', authenticate_user, suggestionsController.getMutualFollowers);

// Check/update streak
router.post('/streak/check', authenticate_user, xpController.checkStreak);

// Get user XP details
router.get('/:id/xp', xpController.getUserXP);

// Get user badges
router.get('/:id/badges', xpController.getUserBadges);

// Get user streak
router.get('/:id/streak', xpController.getUserStreak);

export default router;

