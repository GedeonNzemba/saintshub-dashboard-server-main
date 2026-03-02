import express from "express";
import authMiddleware, { optionalAuthMiddleware } from "../middlewares/authMiddleware";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import {
  // Posts
  createPost,
  createUserPost,
  getChurchPosts,
  getPost,
  updatePost,
  deletePost,
  togglePinPost,
  // Reactions
  reactToPost,
  getPostReactions,
  // Comments
  addComment,
  getComments,
  updateComment,
  deleteComment,
  reactToComment,
  // Statuses
  createStatus,
  createUserStatus,
  getChurchStatuses,
  deleteStatus,
  viewStatus,
  reactToStatus,
  getStatusViewers,
  getStatusReactions,
  // Membership
  joinChurch,
  leaveChurch,
  getChurchMembers,
  updateMemberRole,
  // Feed
  getHomeFeed,
  getStatusesFeed,
  // Bookmarks
  toggleBookmark,
  getBookmarks,
  checkBookmark,
} from "../controllers/socialController";

import {
  getCommunityProfile,
  updateCommunityProfile,
} from "../controllers/communityProfileController";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// POSTS
// ═══════════════════════════════════════════════════════════════════════════

// Create a church post (auth required)
router.post("/churches/:churchId/posts", authMiddleware, createPost);

// Create a user-level post (not tied to any church)
router.post("/posts", authMiddleware, createUserPost);

// Get church posts (public, but auth enriches responses with user reactions & bookmarks)
router.get("/churches/:churchId/posts", optionalAuthMiddleware, getChurchPosts);

// Get single post
router.get("/posts/:postId", getPost);

// Update post (author only, within edit window)
router.patch("/posts/:postId", authMiddleware, updatePost);

// Delete post (author or church owner)
router.delete("/posts/:postId", authMiddleware, deletePost);

// Pin/unpin post (admin only)
router.post("/posts/:postId/pin", authMiddleware, togglePinPost);

// ═══════════════════════════════════════════════════════════════════════════
// REACTIONS
// ═══════════════════════════════════════════════════════════════════════════

// React to post (toggle)
router.post("/posts/:postId/react", authMiddleware, reactToPost);

// Get post reactions breakdown
router.get("/posts/:postId/reactions", cacheMiddleware(30), getPostReactions);

// ═══════════════════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════════════════

// Add comment to post
router.post("/posts/:postId/comments", authMiddleware, addComment);

// Get comments for post (paginated, threaded)
router.get("/posts/:postId/comments", cacheMiddleware(30), getComments);

// Update comment (author only)
router.patch("/comments/:commentId", authMiddleware, updateComment);

// Delete comment (author or post author)
router.delete("/comments/:commentId", authMiddleware, deleteComment);

// React to comment
router.post("/comments/:commentId/react", authMiddleware, reactToComment);

// ═══════════════════════════════════════════════════════════════════════════
// STATUSES (24h ephemeral)
// ═══════════════════════════════════════════════════════════════════════════

// Create status (church admin+)
router.post("/churches/:churchId/statuses", authMiddleware, createStatus);

// Create user-level story (any authenticated user)
router.post("/statuses", authMiddleware, createUserStatus);

// Get church statuses (active only)
router.get("/churches/:churchId/statuses", cacheMiddleware(30), getChurchStatuses);

// Delete status
router.delete("/statuses/:statusId", authMiddleware, deleteStatus);

// Mark status as viewed
router.post("/statuses/:statusId/view", authMiddleware, viewStatus);

// React to status
router.post("/statuses/:statusId/react", authMiddleware, reactToStatus);

// Get status viewers (author only)
router.get("/statuses/:statusId/viewers", authMiddleware, getStatusViewers);

// Get status reactions with user info (author only)
router.get("/statuses/:statusId/reactions", authMiddleware, getStatusReactions);

// ═══════════════════════════════════════════════════════════════════════════
// MEMBERSHIP
// ═══════════════════════════════════════════════════════════════════════════

// Join church
router.post("/churches/:churchId/join", authMiddleware, joinChurch);

// Leave church
router.delete("/churches/:churchId/leave", authMiddleware, leaveChurch);

// Get church members (paginated)
router.get("/churches/:churchId/members", cacheMiddleware(120), getChurchMembers);

// Update member role (owner only)
router.patch("/churches/:churchId/members/:userId/role", authMiddleware, updateMemberRole);

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATED FEEDS
// ═══════════════════════════════════════════════════════════════════════════

// Home feed (posts from followed churches)
router.get("/feed", authMiddleware, getHomeFeed);

// Status feed (statuses from followed churches, grouped)
router.get("/statuses/feed", authMiddleware, getStatusesFeed);

// ═══════════════════════════════════════════════════════════════════════════
// BOOKMARKS / SAVED POSTS
// ═══════════════════════════════════════════════════════════════════════════

// Toggle bookmark on a post (save / unsave)
router.post("/posts/:postId/bookmark", authMiddleware, toggleBookmark);

// Check if post is bookmarked
router.get("/posts/:postId/bookmark", authMiddleware, checkBookmark);

// Get all bookmarked posts for the current user (paginated)
router.get("/bookmarks", authMiddleware, getBookmarks);

// ═══════════════════════════════════════════════════════════════════════════
// COMMUNITY PROFILE / BRANDING
// ═══════════════════════════════════════════════════════════════════════════

// Get community profile (public)
router.get("/churches/:churchId/community-profile", getCommunityProfile);

// Update community profile (owner/admin only)
router.patch("/churches/:churchId/community-profile", authMiddleware, updateCommunityProfile);

export default router;
