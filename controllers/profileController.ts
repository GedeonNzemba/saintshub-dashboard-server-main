/**
 * Profile Controller
 *
 * Handles user social profiles – public viewing, editing, follow/unfollow,
 * and follower/following lists.
 */
import { Request, Response } from "express";
import User from "../models/User";
import { FollowModel } from "../models/Follow";
import { PostModel } from "../models/Post";
import { ReactionModel } from "../models/Reaction";
import { emitUserNotification } from "../utils/userNotifications";
import { UserNotificationModel } from "../models/UserNotification";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  userId?: string;
  params: any;
  body: any;
  query: any;
}

// ─── Sanitised public projection (never leak password / tokens) ──────────
const PUBLIC_FIELDS =
  "_id name surname email avatar username bio coverPhoto website location pronouns " +
  "role followersCount followingCount postsCount likesCount isPrivate createdAt";

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/profile/:userId  — View someone's public profile
// ═════════════════════════════════════════════════════════════════════════════

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select(PUBLIC_FIELDS).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure counter fields are never undefined (for legacy users)
    user.followersCount = user.followersCount ?? 0;
    user.followingCount = user.followingCount ?? 0;
    user.postsCount = user.postsCount ?? 0;
    user.likesCount = user.likesCount ?? 0;

    // Determine follow status: 'none' | 'pending' | 'following'
    let followStatus: 'none' | 'pending' | 'following' = 'none';
    let isFollowing = false;
    if (req.userId && req.userId !== userId) {
      const follow = await FollowModel.findOne({
        followerId: req.userId,
        followingId: userId,
      }).lean();
      if (follow) {
        followStatus = follow.status === 'pending' ? 'pending' : 'following';
        isFollowing = follow.status === 'approved';
      }
    }

    const isOwnProfile = req.userId === userId;

    return res.status(200).json({
      user,
      isFollowing,
      followStatus,
      isOwnProfile,
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/profile  — Update own profile
// ═════════════════════════════════════════════════════════════════════════════

const ALLOWED_FIELDS = [
  "name", "surname", "username", "bio", "coverPhoto",
  "website", "location", "pronouns", "dateOfBirth", "isPrivate",
] as const;

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updates: Record<string, any> = {};

    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Username uniqueness check
    if (updates.username) {
      updates.username = updates.username.toLowerCase().trim().replace(/[^a-z0-9._]/g, "");
      if (updates.username.length < 3 || updates.username.length > 30) {
        return res.status(400).json({ message: "Username must be 3–30 characters (letters, numbers, . and _)" });
      }
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.userId } });
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Check if switching from private → public: auto-approve all pending requests
    if (updates.isPrivate === false) {
      const currentUser = await User.findById(req.userId).select('isPrivate').lean();
      if (currentUser?.isPrivate === true) {
        // Find all pending follow requests for this user
        const pendingFollows = await FollowModel.find({
          followingId: req.userId,
          status: 'pending',
        }).lean();

        if (pendingFollows.length > 0) {
          // Approve all pending requests
          await FollowModel.updateMany(
            { followingId: req.userId, status: 'pending' },
            { $set: { status: 'approved' } }
          );

          // Increment counters for all newly approved follows
          await User.findByIdAndUpdate(req.userId, {
            $inc: { followersCount: pendingFollows.length },
          });

          // Increment followingCount for each follower
          const followerIds = pendingFollows.map(f => f.followerId);
          await User.updateMany(
            { _id: { $in: followerIds } },
            { $inc: { followingCount: 1 } }
          );

          // Notify each follower that their request was accepted
          const me = await User.findById(req.userId).select('name surname avatar').lean();
          if (me) {
            const myName = `${me.name} ${me.surname || ''}`.trim();
            for (const f of pendingFollows) {
              emitUserNotification({
                recipientId: f.followerId.toString(),
                actorId: req.userId!,
                actorName: myName,
                actorAvatar: me.avatar?.url,
                type: 'follow_request_accepted',
                message: `${myName} accepted your follow request`,
                resourceType: 'user',
                resourceId: req.userId!,
              });
            }
          }

          // Clean up all follow_request notifications for this user (bulk approve)
          await UserNotificationModel.updateMany(
            {
              recipientId: new mongoose.Types.ObjectId(req.userId!),
              type: 'follow_request',
              actorId: { $in: followerIds.map(id => new mongoose.Types.ObjectId(id.toString())) },
            },
            {
              $set: { type: 'follow', read: true },
            }
          ).catch(err => console.error('Failed to bulk-update follow_request notifications:', err));
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select(PUBLIC_FIELDS);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "Profile updated", user });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/profile/:userId/follow  — Toggle follow / unfollow
// ═════════════════════════════════════════════════════════════════════════════

export const toggleFollow = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetId } = req.params;
    const followerId = req.userId!;

    if (followerId === targetId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const existing = await FollowModel.findOne({ followerId, followingId: targetId });

    if (existing) {
      // Unfollow (or cancel pending request)
      const wasPending = existing.status === 'pending';
      await existing.deleteOne();

      // Only decrement counters if the follow was approved (not pending)
      if (!wasPending) {
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
      }

      return res.status(200).json({
        followed: false,
        followStatus: 'none',
        message: wasPending ? "Follow request cancelled" : "Unfollowed",
      });
    }

    // New follow — check if target is private
    const isTargetPrivate = targetUser.isPrivate === true;
    const followStatus = isTargetPrivate ? 'pending' : 'approved';

    await FollowModel.create({ followerId, followingId: targetId, status: followStatus });

    // Only increment counters for approved follows
    if (!isTargetPrivate) {
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });
    }

    // Notify the target user
    const follower = await User.findById(followerId).select('name surname avatar').lean();
    if (follower) {
      const actorName = `${follower.name} ${follower.surname || ''}`.trim();
      emitUserNotification({
        recipientId: targetId,
        actorId: followerId,
        actorName,
        actorAvatar: follower.avatar?.url,
        type: isTargetPrivate ? 'follow_request' : 'follow',
        message: isTargetPrivate
          ? `${actorName} requested to follow you`
          : `${actorName} started following you`,
        resourceType: 'user',
        resourceId: followerId,
      });
    }

    return res.status(200).json({
      followed: !isTargetPrivate,
      followStatus: isTargetPrivate ? 'pending' : 'following',
      message: isTargetPrivate ? "Follow request sent" : "Followed",
    });
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    return res.status(500).json({ message: "Failed to toggle follow", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/profile/:userId/followers?page=1&limit=20
// ═════════════════════════════════════════════════════════════════════════════

export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const approvedFilter = { followingId: userId, status: { $ne: 'pending' } };

    const [follows, total] = await Promise.all([
      FollowModel.find(approvedFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FollowModel.countDocuments(approvedFilter),
    ]);

    const followerIds = follows.map(f => f.followerId);
    const users = await User.find({ _id: { $in: followerIds } })
      .select("_id name surname avatar username bio")
      .lean();

    // Preserve ordering
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const followers = followerIds.map(id => userMap.get(id.toString())).filter(Boolean);

    return res.status(200).json({
      followers,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching followers:", error);
    return res.status(500).json({ message: "Failed to fetch followers", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/profile/:userId/following?page=1&limit=20
// ═════════════════════════════════════════════════════════════════════════════

export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const approvedFilter = { followerId: userId, status: { $ne: 'pending' } };

    const [follows, total] = await Promise.all([
      FollowModel.find(approvedFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FollowModel.countDocuments(approvedFilter),
    ]);

    const followingIds = follows.map(f => f.followingId);
    const users = await User.find({ _id: { $in: followingIds } })
      .select("_id name surname avatar username bio")
      .lean();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const following = followingIds.map(id => userMap.get(id.toString())).filter(Boolean);

    return res.status(200).json({
      following,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching following:", error);
    return res.status(500).json({ message: "Failed to fetch following", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/profile/:userId/posts?page=1&limit=20  — User's posts grid
// ═════════════════════════════════════════════════════════════════════════════

export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = req.userId;
    const isOwnProfile = requesterId === userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    // Privacy gate: if target is private and requester is not an approved follower
    if (!isOwnProfile) {
      const targetUser = await User.findById(userId).select('isPrivate').lean();
      if (targetUser?.isPrivate) {
        const approvedFollow = await FollowModel.findOne({
          followerId: requesterId,
          followingId: userId,
          status: { $ne: 'pending' },
        });
        if (!approvedFollow) {
          return res.status(200).json({
            posts: [],
            page: 1,
            totalPages: 0,
            total: 0,
            hasMore: false,
            isPrivateProfile: true,
          });
        }
      }
    }

    const [posts, total] = await Promise.all([
      PostModel.find({ authorId: userId, visibility: "public" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments({ authorId: userId, visibility: "public" }),
    ]);

    return res.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({ message: "Failed to fetch user posts", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/profile/:userId/liked-posts?page=1&limit=20  — Posts the user liked
// ═════════════════════════════════════════════════════════════════════════════

export const getLikedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Count total liked posts
    const total = await ReactionModel.countDocuments({
      userId,
      targetType: "post",
    });

    // Get the reaction records (sorted newest first)
    const reactions = await ReactionModel.find({
      userId,
      targetType: "post",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = reactions.map((r) => r.targetId);

    // Fetch the corresponding posts
    const posts = await PostModel.find({ _id: { $in: postIds } }).lean();

    // Preserve chronological order of reactions (most recently liked first)
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
    const orderedPosts = postIds
      .map((id) => {
        const post = postMap.get(id.toString());
        if (!post) return null;
        // Attach the reaction type & date for the frontend
        const reaction = reactions.find(
          (r) => r.targetId.toString() === id.toString()
        );
        return {
          ...post,
          likedAt: reaction?.createdAt,
          reactionType: reaction?.type,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      posts: orderedPosts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching liked posts:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch liked posts", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/profile/follow-requests?page=1&limit=20  — Pending follow requests
// ═════════════════════════════════════════════════════════════════════════════

export const getFollowRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const pendingFilter = { followingId: userId, status: 'pending' };

    const [follows, total] = await Promise.all([
      FollowModel.find(pendingFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FollowModel.countDocuments(pendingFilter),
    ]);

    const requesterIds = follows.map(f => f.followerId);
    const users = await User.find({ _id: { $in: requesterIds } })
      .select("_id name surname avatar username bio")
      .lean();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const requests = follows.map(f => ({
      followId: f._id,
      user: userMap.get(f.followerId.toString()) || null,
      createdAt: f.createdAt,
    })).filter(r => r.user);

    return res.status(200).json({
      requests,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching follow requests:", error);
    return res.status(500).json({ message: "Failed to fetch follow requests", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/profile/follow-requests/:followId/accept  — Accept a follow request
// ═════════════════════════════════════════════════════════════════════════════

export const acceptFollowRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { followId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(followId)) {
      return res.status(400).json({ message: "Invalid follow request ID" });
    }

    // Try finding by Follow doc _id first, then by follower userId
    let follow = await FollowModel.findOne({
      _id: followId,
      followingId: userId,
      status: 'pending',
    });

    if (!follow) {
      // Fallback: followId might actually be the follower's userId
      follow = await FollowModel.findOne({
        followerId: followId,
        followingId: userId,
        status: 'pending',
      });
    }

    if (!follow) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    // Approve the follow
    follow.status = 'approved';
    await follow.save();

    // Increment both users' counters
    await Promise.all([
      User.findByIdAndUpdate(follow.followerId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } }),
    ]);

    // Notify the requester that their request was accepted
    const me = await User.findById(userId).select('name surname avatar').lean();
    if (me) {
      const myName = `${me.name} ${me.surname || ''}`.trim();
      emitUserNotification({
        recipientId: follow.followerId.toString(),
        actorId: userId,
        actorName: myName,
        actorAvatar: me.avatar?.url,
        type: 'follow_request_accepted',
        message: `${myName} accepted your follow request`,
        resourceType: 'user',
        resourceId: userId,
      });
    }

    // Update the original follow_request notification so it no longer shows action buttons
    await UserNotificationModel.updateMany(
      {
        recipientId: new mongoose.Types.ObjectId(userId),
        actorId: new mongoose.Types.ObjectId(follow.followerId.toString()),
        type: 'follow_request',
      },
      {
        $set: {
          type: 'follow',
          message: `${(me ? `${me.name} ${me.surname || ''}`.trim() : 'Someone')} — follow request accepted`,
          read: true,
        },
      }
    ).catch(err => console.error('Failed to update follow_request notification:', err));

    return res.status(200).json({
      message: "Follow request accepted",
      followId: follow._id,
    });
  } catch (error: any) {
    console.error("Error accepting follow request:", error);
    return res.status(500).json({ message: "Failed to accept follow request", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/profile/follow-requests/:followId/reject  — Reject a follow request
// ═════════════════════════════════════════════════════════════════════════════

export const rejectFollowRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { followId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(followId)) {
      return res.status(400).json({ message: "Invalid follow request ID" });
    }

    // Try finding by Follow doc _id first, then by follower userId
    let follow = await FollowModel.findOne({
      _id: followId,
      followingId: userId,
      status: 'pending',
    });

    if (!follow) {
      // Fallback: followId might actually be the follower's userId
      follow = await FollowModel.findOne({
        followerId: followId,
        followingId: userId,
        status: 'pending',
      });
    }

    if (!follow) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    // Delete the follow document (no counter changes needed since it was pending)
    await follow.deleteOne();

    // Remove the original follow_request notification
    await UserNotificationModel.deleteMany({
      recipientId: new mongoose.Types.ObjectId(userId),
      actorId: new mongoose.Types.ObjectId(follow.followerId.toString()),
      type: 'follow_request',
    }).catch(err => console.error('Failed to delete follow_request notification:', err));

    return res.status(200).json({
      message: "Follow request rejected",
      followId,
    });
  } catch (error: any) {
    console.error("Error rejecting follow request:", error);
    return res.status(500).json({ message: "Failed to reject follow request", error: error.message });
  }
};
