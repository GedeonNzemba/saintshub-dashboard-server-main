/**
 * Social Notification Controller
 *
 * Endpoints for church admins to view notifications,
 * mark as read, and get engagement analytics.
 */

import { Request, Response } from "express";
import { SocialNotificationModel } from "../models/SocialNotification";
import { PostModel } from "../models/Post";
import { CommentModel } from "../models/Comment";
import { ReactionModel } from "../models/Reaction";
import { ChurchMembershipModel } from "../models/ChurchMembership";
import { ChurchModel } from "../models/Space";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  userId?: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * GET /churches/:churchId/notifications
 * Paginated notifications for a church (admin/owner only)
 */
export const getChurchNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const skip = (page - 1) * limit;
    const typeFilter = req.query.type as string;

    // Verify ownership/admin
    const church = await ChurchModel.findById(churchId).select('user');
    if (!church) return res.status(404).json({ message: 'Church not found' });

    const isOwner = church.user._id.toString() === req.userId;
    const isAdmin = await ChurchMembershipModel.findOne({
      userId: req.userId, churchId, role: { $in: ['owner', 'admin'] }, isApproved: true,
    });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only church admins can view notifications' });
    }

    const filter: any = { churchId };
    if (typeFilter) filter.type = typeFilter;

    const [notifications, total, unreadCount] = await Promise.all([
      SocialNotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SocialNotificationModel.countDocuments(filter),
      SocialNotificationModel.countDocuments({ churchId, read: false }),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

/**
 * POST /churches/:churchId/notifications/read
 * Mark notifications as read (batch)
 */
export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const { notificationIds } = req.body; // optional: array of IDs; if absent, mark ALL read

    const church = await ChurchModel.findById(churchId).select('user');
    if (!church) return res.status(404).json({ message: 'Church not found' });

    const isOwner = church.user._id.toString() === req.userId;
    const isAdmin = await ChurchMembershipModel.findOne({
      userId: req.userId, churchId, role: { $in: ['owner', 'admin'] }, isApproved: true,
    });
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filter: any = { churchId, read: false };
    if (notificationIds?.length) {
      filter._id = { $in: notificationIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
    }

    const result = await SocialNotificationModel.updateMany(filter, { $set: { read: true } });

    return res.status(200).json({
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Error marking notifications read:', error);
    return res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};

/**
 * GET /churches/:churchId/notifications/count
 * Quick unread count (lightweight endpoint for badges)
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    const church = await ChurchModel.findById(churchId).select('user');
    if (!church) return res.status(404).json({ message: 'Church not found' });

    const isOwner = church.user._id.toString() === req.userId;
    if (!isOwner) {
      const isAdmin = await ChurchMembershipModel.findOne({
        userId: req.userId, churchId, role: { $in: ['owner', 'admin'] }, isApproved: true,
      });
      if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });
    }

    const count = await SocialNotificationModel.countDocuments({ churchId, read: false });
    return res.status(200).json({ unreadCount: count });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ message: 'Failed to fetch count', error: error.message });
  }
};

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * GET /churches/:churchId/analytics
 * Overview stats: total posts, total reactions, total comments,
 * total members, engagement rate, top posts, and weekly trend.
 */
export const getChurchAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    const church = await ChurchModel.findById(churchId).select('user name');
    if (!church) return res.status(404).json({ message: 'Church not found' });

    const isOwner = church.user._id.toString() === req.userId;
    const isAdmin = await ChurchMembershipModel.findOne({
      userId: req.userId, churchId, role: { $in: ['owner', 'admin'] }, isApproved: true,
    });
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only church admins can view analytics' });
    }

    const churchObjId = new mongoose.Types.ObjectId(churchId);
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate all stats in parallel
    const [
      totalPosts,
      totalComments,
      totalMembers,
      recentPosts,
      weeklyReactions,
      topPosts,
      notificationBreakdown,
    ] = await Promise.all([
      PostModel.countDocuments({ churchId }),
      CommentModel.countDocuments({
        postId: { $in: await PostModel.find({ churchId }).distinct('_id') },
      }),
      ChurchMembershipModel.countDocuments({ churchId, isApproved: true }),
      PostModel.countDocuments({ churchId, createdAt: { $gte: thirtyDaysAgo } }),
      ReactionModel.countDocuments({
        targetId: {
          $in: await PostModel.find({ churchId, createdAt: { $gte: sevenDaysAgo } }).distinct('_id'),
        },
        targetType: 'post',
      }),
      PostModel.find({ churchId })
        .sort({ likesCount: -1, commentsCount: -1 })
        .limit(5)
        .select('content.text likesCount commentsCount sharesCount createdAt')
        .lean(),
      SocialNotificationModel.aggregate([
        { $match: { churchId: churchObjId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    // Total reactions on church posts
    const totalReactions = await ReactionModel.countDocuments({
      targetId: { $in: await PostModel.find({ churchId }).distinct('_id') },
      targetType: 'post',
    });

    // Engagement rate = (reactions + comments) / (posts * members) * 100
    const engagementRate =
      totalPosts > 0 && totalMembers > 0
        ? Math.round(((totalReactions + totalComments) / (totalPosts * totalMembers)) * 10000) / 100
        : 0;

    // Format notification breakdown
    const activityBreakdown: Record<string, number> = {};
    for (const item of notificationBreakdown) {
      activityBreakdown[item._id] = item.count;
    }

    return res.status(200).json({
      churchName: church.name,
      stats: {
        totalPosts,
        totalComments,
        totalReactions,
        totalMembers,
        recentPosts30d: recentPosts,
        weeklyReactions7d: weeklyReactions,
        engagementRate,
      },
      topPosts: topPosts.map((p: any) => ({
        _id: p._id,
        snippet: p.content?.text?.slice(0, 100) || '(media post)',
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        createdAt: p.createdAt,
      })),
      activityBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
