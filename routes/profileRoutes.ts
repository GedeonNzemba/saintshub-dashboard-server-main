/**
 * Profile Routes
 *
 * Public & authenticated endpoints for user social profiles.
 *
 * GET    /api/profile/:userId           — View profile (public)
 * PUT    /api/profile                   — Update own profile
 * POST   /api/profile/:userId/follow    — Toggle follow/unfollow
 * GET    /api/profile/:userId/followers  — Followers list
 * GET    /api/profile/:userId/following  — Following list
 * GET    /api/profile/:userId/posts      — User's posts
 */
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getUserPosts,
  getLikedPosts,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from "../controllers/profileController";

const router = Router();

// View any user's profile (auth required for isFollowing check)
router.get("/follow-requests", authMiddleware, getFollowRequests);

// Accept / reject follow requests (must be before /:userId to avoid conflict)
router.post("/follow-requests/:followId/accept", authMiddleware, acceptFollowRequest);
router.post("/follow-requests/:followId/reject", authMiddleware, rejectFollowRequest);

// View any user's profile
router.get("/:userId", authMiddleware, getUserProfile);

// Update own profile
router.put("/", authMiddleware, updateProfile);

// Follow / unfollow
router.post("/:userId/follow", authMiddleware, toggleFollow);

// Followers & following lists
router.get("/:userId/followers", authMiddleware, getFollowers);
router.get("/:userId/following", authMiddleware, getFollowing);

// User's posts
router.get("/:userId/posts", authMiddleware, getUserPosts);

// User's liked posts
router.get("/:userId/liked-posts", authMiddleware, getLikedPosts);

export default router;
