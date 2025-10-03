import { Router } from 'express';
import * as searchController from '../controllers/search';

const router = Router();

// ==================== SEARCH ROUTES ====================

// Global search
router.get('/all', searchController.globalSearch);

// Search posts
router.get('/posts', searchController.searchPosts);

// Get search history
router.get('/history', searchController.getSearchHistory);

// Clear search history
router.delete('/history', searchController.clearSearchHistory);

export default router;

