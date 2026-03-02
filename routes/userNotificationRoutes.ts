/**
 * User Notification Routes
 *
 * User-facing notification endpoints (separate from church-admin notifications).
 * All routes require authentication.
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getUserNotifications,
  markUserNotificationsRead,
  getUserUnreadCount,
  deleteUserNotification,
} from "../controllers/userNotificationController";

const router = Router();

// GET  /notifications          — List user notifications (paginated, filterable by type)
router.get("/notifications", authMiddleware, getUserNotifications);

// POST /notifications/read     — Mark notifications as read (specific IDs or all)
router.post("/notifications/read", authMiddleware, markUserNotificationsRead);

// GET  /notifications/count    — Unread badge count
router.get("/notifications/count", authMiddleware, getUserUnreadCount);

// DELETE /notifications/:id    — Delete a single notification
router.delete("/notifications/:id", authMiddleware, deleteUserNotification);

export default router;
