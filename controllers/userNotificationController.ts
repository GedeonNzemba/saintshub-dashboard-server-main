/**
 * User Notification Controller
 *
 * Endpoints for the user-facing notification system.
 * Separate from church-admin notifications (socialNotificationController).
 */

import { Request, Response } from "express";
import { UserNotificationModel } from "../models/UserNotification";
import mongoose from "mongoose";

interface AuthRequest {
  userId?: string;
  query: any;
  body: any;
  params: any;
}

// ============================================================================
// GET /api/notifications — List user notifications (paginated)
// ============================================================================

export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const skip = (page - 1) * limit;
    const typeFilter = req.query.type as string | undefined;

    const filter: any = { recipientId: req.userId };
    if (typeFilter) {
      filter.type = typeFilter;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      UserNotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserNotificationModel.countDocuments(filter),
      UserNotificationModel.countDocuments({ recipientId: req.userId, read: false }),
    ]);

    // Group notifications by type+resource for "N people liked your post" style
    // We return raw list + grouping hints — the frontend handles display
    return res.status(200).json({
      notifications,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching user notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// ============================================================================
// POST /api/notifications/read — Mark notifications as read
// ============================================================================

export const markUserNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationIds } = req.body;

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      await UserNotificationModel.updateMany(
        {
          _id: { $in: notificationIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
          recipientId: req.userId,
        },
        { $set: { read: true } }
      );
    } else {
      // Mark all as read
      await UserNotificationModel.updateMany(
        { recipientId: req.userId, read: false },
        { $set: { read: true } }
      );
    }

    const unreadCount = await UserNotificationModel.countDocuments({
      recipientId: req.userId,
      read: false,
    });

    return res.status(200).json({ message: "Notifications marked as read", unreadCount });
  } catch (error: any) {
    console.error("Error marking notifications read:", error);
    return res.status(500).json({ message: "Failed to mark notifications", error: error.message });
  }
};

// ============================================================================
// GET /api/notifications/count — Unread count (lightweight for badges)
// ============================================================================

export const getUserUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const unreadCount = await UserNotificationModel.countDocuments({
      recipientId: req.userId,
      read: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({ message: "Failed to fetch count", error: error.message });
  }
};

// ============================================================================
// DELETE /api/notifications/:id — Delete a single notification
// ============================================================================

export const deleteUserNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await UserNotificationModel.findOneAndDelete({
      _id: id,
      recipientId: req.userId,
    });

    if (!result) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Failed to delete notification", error: error.message });
  }
};
