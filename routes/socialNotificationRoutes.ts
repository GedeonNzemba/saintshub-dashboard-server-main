import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import {
  getChurchNotifications,
  markNotificationsRead,
  getUnreadCount,
  getChurchAnalytics,
} from "../controllers/socialNotificationController";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// CHURCH NOTIFICATIONS (admin/owner only)
// ═══════════════════════════════════════════════════════════════════════════

// Get paginated notifications
router.get(
  "/churches/:churchId/notifications",
  authMiddleware,
  getChurchNotifications
);

// Mark notifications as read (batch or all)
router.post(
  "/churches/:churchId/notifications/read",
  authMiddleware,
  markNotificationsRead
);

// Quick unread badge count
router.get(
  "/churches/:churchId/notifications/count",
  authMiddleware,
  cacheMiddleware(15),
  getUnreadCount
);

// ═══════════════════════════════════════════════════════════════════════════
// CHURCH ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  "/churches/:churchId/analytics",
  authMiddleware,
  getChurchAnalytics
);

export default router;
