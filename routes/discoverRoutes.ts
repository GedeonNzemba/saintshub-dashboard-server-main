/**
 * Discover / Search Routes
 *
 * GET  /api/discover/search/posts?q=...      — Search posts (full-text)
 * GET  /api/discover/search/users?q=...      — Search users (full-text + regex)
 * GET  /api/discover/search/churches?q=...   — Search churches (full-text + regex)
 * GET  /api/discover/trending                — Trending posts (time-decay scoring)
 * GET  /api/discover/suggested-users         — Users to follow
 * GET  /api/discover/popular-tags            — Popular hashtags
 */
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  searchPosts,
  searchUsers,
  searchChurches,
  getTrendingPosts,
  getSuggestedUsers,
  getPopularTags,
} from "../controllers/discoverController";

const router = Router();

// Search endpoints (auth required for follow-status enrichment)
router.get("/search/posts", authMiddleware, searchPosts);
router.get("/search/users", authMiddleware, searchUsers);
router.get("/search/churches", authMiddleware, searchChurches);

// Discovery endpoints
router.get("/trending", authMiddleware, getTrendingPosts);
router.get("/suggested-users", authMiddleware, getSuggestedUsers);
router.get("/popular-tags", authMiddleware, getPopularTags);

export default router;
