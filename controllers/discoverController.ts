/**
 * Discover / Search Controller
 *
 * Endpoints for the unified discover & search feature:
 * - Full-text search across posts, users, churches
 * - Trending posts (time-decay engagement scoring)
 * - Suggested users to follow
 * - Popular tags
 */

import { Request, Response } from "express";
import { PostModel } from "../models/Post";
import { ChurchModel } from "../models/Space";
import User from "../models/User";
import { FollowModel } from "../models/Follow";
import mongoose from "mongoose";

interface AuthRequest {
  userId?: string;
  query: any;
  body: any;
  params: any;
}

// ============================================================================
// GET /api/discover/search/posts?q=...&page=1&limit=20
// ============================================================================

export const searchPosts = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || "").trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: "Search query 'q' is required" });
    }

    // Use $text for full-text search on content.text + tags
    const filter: any = {
      $text: { $search: q },
      visibility: "public",
      type: { $ne: "status" }, // Exclude ephemeral stories
    };

    const [posts, total] = await Promise.all([
      PostModel.find(filter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error searching posts:", error);
    return res.status(500).json({ message: "Search failed", error: error.message });
  }
};

// ============================================================================
// GET /api/discover/search/users?q=...&page=1&limit=20
// ============================================================================

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || "").trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: "Search query 'q' is required" });
    }

    // Combine $text search with regex fallback for partial matches
    // $text is best for full words; regex handles partial/prefix matching
    const textFilter = { $text: { $search: q } };
    const regexFilter = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { surname: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
    };

    // Try text search first, fall back to regex for partial matches
    let users: any[];
    let total: number;

    const textCount = await User.countDocuments(textFilter);
    if (textCount > 0) {
      [users, total] = await Promise.all([
        User.find(textFilter, { score: { $meta: "textScore" } })
          .select("name surname username bio avatar followersCount followingCount postsCount")
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(limit)
          .lean(),
        Promise.resolve(textCount),
      ]);
    } else {
      // Fallback to regex for partial matching (e.g. typing "joh" to find "John")
      [users, total] = await Promise.all([
        User.find(regexFilter)
          .select("name surname username bio avatar followersCount followingCount postsCount")
          .sort({ followersCount: -1, name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(regexFilter),
      ]);
    }

    // Check follow status for each returned user
    if (req.userId) {
      const follows = await FollowModel.find({
        followerId: req.userId,
        followingId: { $in: users.map((u: any) => u._id) },
      }).lean();
      const followSet = new Set(follows.map((f: any) => f.followingId.toString()));

      users = users.map((u: any) => ({
        ...u,
        isFollowing: followSet.has(u._id.toString()),
      }));
    }

    return res.status(200).json({
      users,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Search failed", error: error.message });
  }
};

// ============================================================================
// GET /api/discover/search/churches?q=...&page=1&limit=20
// ============================================================================

export const searchChurches = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || "").trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: "Search query 'q' is required" });
    }

    const textFilter = { $text: { $search: q } };
    const regexFilter = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    };

    let churches: any[];
    let total: number;

    const textCount = await ChurchModel.countDocuments(textFilter);
    if (textCount > 0) {
      [churches, total] = await Promise.all([
        ChurchModel.find(textFilter, { score: { $meta: "textScore" } })
          .select("name location denomination mainImage address contact user")
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(limit)
          .lean(),
        Promise.resolve(textCount),
      ]);
    } else {
      [churches, total] = await Promise.all([
        ChurchModel.find(regexFilter)
          .select("name location denomination mainImage address contact user")
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChurchModel.countDocuments(regexFilter),
      ]);
    }

    return res.status(200).json({
      churches,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error searching churches:", error);
    return res.status(500).json({ message: "Search failed", error: error.message });
  }
};

// ============================================================================
// GET /api/discover/trending?page=1&limit=20
// Time-decay engagement scoring:  score = (likes*2 + comments*3 + shares*5) / (ageHours + 2)^1.5
// ============================================================================

export const getTrendingPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    // Only consider posts from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const pipeline: any[] = [
      {
        $match: {
          visibility: "public",
          type: { $ne: "status" },
          createdAt: { $gte: weekAgo },
        },
      },
      // Calculate trending score with time decay
      {
        $addFields: {
          ageHours: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60, // ms → hours
            ],
          },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $divide: [
              {
                $add: [
                  { $multiply: ["$likesCount", 2] },
                  { $multiply: ["$commentsCount", 3] },
                  { $multiply: ["$sharesCount", 5] },
                ],
              },
              { $pow: [{ $add: ["$ageHours", 2] }, 1.5] },
            ],
          },
        },
      },
      { $sort: { trendingScore: -1 } as any },
      {
        $facet: {
          posts: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await PostModel.aggregate(pipeline);
    const posts = result.posts || [];
    const total = result.total?.[0]?.count || 0;

    return res.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching trending posts:", error);
    return res.status(500).json({ message: "Failed to fetch trending", error: error.message });
  }
};

// ============================================================================
// GET /api/discover/suggested-users?limit=10
// Suggests users to follow based on: not already following, most popular
// ============================================================================

export const getSuggestedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 30);
    const currentUserId = req.userId;

    // Get IDs of users we already follow
    const following = currentUserId
      ? await FollowModel.find({ followerId: currentUserId })
          .select("followingId")
          .lean()
      : [];
    const followingIds = following.map((f: any) => f.followingId.toString());
    if (currentUserId) followingIds.push(currentUserId); // Exclude self

    const excludeIds = followingIds.map((id: string) => new mongoose.Types.ObjectId(id));

    const users = await User.find({
      _id: { $nin: excludeIds },
      isPrivate: { $ne: true },
    })
      .select("name surname username bio avatar followersCount followingCount postsCount")
      .sort({ followersCount: -1, postsCount: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ users });
  } catch (error: any) {
    console.error("Error fetching suggested users:", error);
    return res.status(500).json({ message: "Failed to fetch suggestions", error: error.message });
  }
};

// ============================================================================
// GET /api/discover/popular-tags?limit=20
// Aggregates most-used tags from recent posts
// ============================================================================

export const getPopularTags = async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    // Tags from last 30 days
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const tags = await PostModel.aggregate([
      {
        $match: {
          visibility: "public",
          type: { $ne: "status" },
          tags: { $exists: true, $ne: [] },
          createdAt: { $gte: monthAgo },
        },
      },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
          latestPost: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, latestPost: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          count: 1,
          latestPost: 1,
        },
      },
    ]);

    return res.status(200).json({ tags });
  } catch (error: any) {
    console.error("Error fetching popular tags:", error);
    return res.status(500).json({ message: "Failed to fetch tags", error: error.message });
  }
};
