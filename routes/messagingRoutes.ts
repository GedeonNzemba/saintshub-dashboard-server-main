/**
 * Messaging Routes
 *
 * Direct messaging endpoints for 1-to-1 conversations.
 *
 * POST   /api/messages/conversations                          — Get or create conversation
 * GET    /api/messages/conversations                          — List conversations (inbox)
 * GET    /api/messages/conversations/:conversationId/messages  — Message history
 * POST   /api/messages/conversations/:conversationId/messages  — Send a message
 * POST   /api/messages/conversations/:conversationId/read      — Mark messages read
 * DELETE /api/messages/conversations/:conversationId           — Delete conversation
 * GET    /api/messages/unread-count                            — Total unread badge count
 */
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getOrCreateConversation,
  getConversations,
  sendMessage,
  getMessages,
  markMessagesRead,
  getUnreadCount,
  deleteConversation,
} from "../controllers/messagingController";

const router = Router();

// Unread count (must be before /:conversationId routes)
router.get("/unread-count", authMiddleware, getUnreadCount);

// Conversation list & creation
router.get("/conversations", authMiddleware, getConversations);
router.post("/conversations", authMiddleware, getOrCreateConversation);

// Messages within a conversation
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);
router.post("/conversations/:conversationId/messages", authMiddleware, sendMessage);

// Mark as read
router.post("/conversations/:conversationId/read", authMiddleware, markMessagesRead);

// Delete conversation
router.delete("/conversations/:conversationId", authMiddleware, deleteConversation);

export default router;
