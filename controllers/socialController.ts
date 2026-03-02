import { Request, Response } from "express";
import { PostModel } from "../models/Post";
import { CommentModel } from "../models/Comment";
import { ReactionModel, ReactionType } from "../models/Reaction";
import { StatusModel } from "../models/Status";
import { ChurchMembershipModel } from "../models/ChurchMembership";
import { BookmarkModel } from "../models/Bookmark";
import { ChurchModel } from "../models/Space";
import User from "../models/User";
import mongoose from "mongoose";
import { emitSocialNotification } from "../utils/socialNotifications";
import { emitUserNotification, emitUserNotificationBatch } from "../utils/userNotifications";

/**
 * Extract the church logo URL from multiple possible sources:
 * 1. Top-level `logo` field
 * 2. Top-level `image` field
 * 3. Hero-banner block's `config.logoUrl` (page builder)
 */
function extractChurchLogo(church: any): string {
  if (church.logo) return church.logo;
  if (church.image) return church.image;
  // Look inside pageBlocks for a hero-banner with logoUrl
  if (Array.isArray(church.pageBlocks)) {
    const heroBanner = church.pageBlocks.find((b: any) => b.type === 'hero-banner');
    if (heroBanner?.config?.logoUrl) return heroBanner.config.logoUrl;
  }
  return '';
}

interface AuthRequest extends Request {
  userId?: string;
}

// ============================================================================
// POSTS
// ============================================================================

/**
 * POST /churches/:churchId/posts
 */
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const { type, content, visibility } = req.body;

    if (!content || (!content.text && (!content.media || content.media.length === 0))) {
      return res.status(400).json({ message: 'Post must have text or media content' });
    }

    const church = await ChurchModel.findById(churchId).select('name logo image pageBlocks user');
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    // Verify user is admin/owner of this church
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isOwner = church.user._id.toString() === req.userId;
    const membership = await ChurchMembershipModel.findOne({
      userId: req.userId,
      churchId,
      role: { $in: ['owner', 'admin', 'moderator', 'editor'] },
      isApproved: true,
    });

    if (!isOwner && !membership) {
      return res.status(403).json({ message: 'Not authorized to post for this church' });
    }

    // Sanitize tags
    const tags: string[] = Array.isArray(req.body.tags)
      ? req.body.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean).slice(0, 10)
      : [];

    const post = await PostModel.create({
      churchId,
      churchName: church.name,
      churchLogo: extractChurchLogo(church),
      authorId: req.userId,
      authorName: `${user.name} ${user.surname || ''}`.trim(),
      authorAvatar: user.avatar?.url || '',
      authorRole: isOwner ? 'Owner' : membership?.role || 'Admin',
      type: type || 'post',
      tags,
      content,
      visibility: visibility || 'public',
    });

    // Process @mentions and send notifications
    const mentions: Array<{ userId: string; username: string }> = Array.isArray(req.body.mentions)
      ? req.body.mentions.filter((m: any) => m.userId && m.userId !== req.userId)
      : [];
    if (mentions.length > 0) {
      const actorName = `${user.name} ${user.surname || ''}`.trim();
      const recipientIds = mentions.map((m: any) => m.userId);
      emitUserNotificationBatch(recipientIds, {
        actorId: req.userId!,
        actorName,
        actorAvatar: user.avatar?.url,
        type: 'mention',
        message: `${actorName} mentioned you in a post`,
        resourceType: 'post',
        resourceId: post._id.toString(),
        meta: {
          postSnippet: content.text?.slice(0, 80),
          churchName: church.name,
          churchId: churchId,
        },
        groupKey: `mention_post_${post._id}`,
      });
    }

    return res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

/**
 * POST /posts  —  Create a user-level post (not tied to a church)
 */
export const createUserPost = async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, visibility } = req.body;

    if (!content || (!content.text && (!content.media || content.media.length === 0))) {
      return res.status(400).json({ message: 'Post must have text or media content' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Sanitize tags
    const tags: string[] = Array.isArray(req.body.tags)
      ? req.body.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean).slice(0, 10)
      : [];

    const post = await PostModel.create({
      // No churchId — this is a user-level post
      authorId: req.userId,
      authorName: `${user.name} ${user.surname || ''}`.trim(),
      authorAvatar: user.avatar?.url || '',
      authorRole: user.role || 'user',
      type: type || 'post',
      tags,
      content,
      visibility: visibility || 'public',
    });

    // Increment user's post count
    await User.findByIdAndUpdate(req.userId, { $inc: { postsCount: 1 } });

    // Process @mentions and send notifications
    const mentions: Array<{ userId: string; username: string }> = Array.isArray(req.body.mentions)
      ? req.body.mentions.filter((m: any) => m.userId && m.userId !== req.userId)
      : [];
    if (mentions.length > 0) {
      const actorName = `${user.name} ${user.surname || ''}`.trim();
      const recipientIds = mentions.map((m: any) => m.userId);
      emitUserNotificationBatch(recipientIds, {
        actorId: req.userId!,
        actorName,
        actorAvatar: user.avatar?.url,
        type: 'mention',
        message: `${actorName} mentioned you in a post`,
        resourceType: 'post',
        resourceId: post._id.toString(),
        meta: { postSnippet: content.text?.slice(0, 80) },
        groupKey: `mention_post_${post._id}`,
      });
    }

    return res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error: any) {
    console.error('Error creating user post:', error);
    return res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

/**
 * GET /churches/:churchId/posts
 */
export const getChurchPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const filter: any = { churchId, visibility: 'public' };

    // If user is a member, also show member-only posts
    const church = await ChurchModel.findById(churchId).select('user logo image pageBlocks');
    if (req.userId) {
      const membership = await ChurchMembershipModel.findOne({
        userId: req.userId, churchId, isApproved: true,
      });
      const isOwner = church?.user._id.toString() === req.userId;

      if (membership || isOwner) {
        filter.visibility = { $in: ['public', 'members'] };
      }
    }

    const [posts, total] = await Promise.all([
      PostModel.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments(filter),
    ]);

    // Attach user's reactions (with byType breakdown) and bookmark status
    let postsWithReactions = posts;
    if (req.userId) {
      const postIds = posts.map(p => p._id);

      // Batch-fetch user's own reactions, all reactions for byType, and bookmarks
      const [userReactions, allReactions, userBookmarks] = await Promise.all([
        ReactionModel.find({
          userId: req.userId,
          targetType: 'post',
          targetId: { $in: postIds },
        }).lean(),
        ReactionModel.find({
          targetType: 'post',
          targetId: { $in: postIds },
        }).lean(),
        BookmarkModel.find({
          userId: req.userId,
          postId: { $in: postIds },
        }).select('postId').lean(),
      ]);

      const reactionMap = new Map(userReactions.map(r => [r.targetId.toString(), r.type]));
      const bookmarkSet = new Set(userBookmarks.map(b => b.postId.toString()));

      // Build byType map: postId -> { like: 2, love: 1, ... }
      const byTypeMap = new Map<string, Record<string, number>>();
      for (const r of allReactions) {
        const pid = r.targetId.toString();
        if (!byTypeMap.has(pid)) byTypeMap.set(pid, {});
        const counts = byTypeMap.get(pid)!;
        counts[r.type] = (counts[r.type] || 0) + 1;
      }

      const churchLogo = church ? extractChurchLogo(church) : '';

      postsWithReactions = posts.map(p => ({
        ...p,
        churchLogo: p.churchLogo || churchLogo,
        canEdit: p.authorId.toString() === req.userId && p.editWindowEnd && new Date(p.editWindowEnd) > new Date(),
        isBookmarked: bookmarkSet.has(p._id.toString()),
        reactions: {
          total: p.likesCount,
          userReaction: reactionMap.get(p._id.toString()) || null,
          byType: byTypeMap.get(p._id.toString()) || {},
        },
      }));
    }

    return res.status(200).json({
      posts: postsWithReactions,
      page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
};

/**
 * GET /posts/:postId
 */
export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findById(postId).lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let enriched: any = { ...post };

    // Backfill churchLogo if missing
    if (post.churchId && !post.churchLogo) {
      const church = await ChurchModel.findById(post.churchId).select('logo image pageBlocks').lean();
      if (church) {
        enriched.churchLogo = extractChurchLogo(church);
      }
    }

    if (req.userId) {
      const [reaction, allReactions, bookmark] = await Promise.all([
        ReactionModel.findOne({
          userId: req.userId, targetType: 'post', targetId: postId,
        }),
        ReactionModel.find({
          targetType: 'post', targetId: postId,
        }).lean(),
        BookmarkModel.findOne({
          userId: req.userId, postId: postId,
        }),
      ]);

      // Build byType
      const byType: Record<string, number> = {};
      for (const r of allReactions) {
        byType[r.type] = (byType[r.type] || 0) + 1;
      }

      enriched.reactions = {
        total: post.likesCount,
        userReaction: reaction?.type || null,
        byType,
      };
      enriched.isBookmarked = !!bookmark;
      enriched.canEdit = post.authorId.toString() === req.userId && post.editWindowEnd && new Date(post.editWindowEnd) > new Date();
    }

    return res.status(200).json({ post: enriched });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ message: 'Failed to fetch post', error: error.message });
  }
};

/**
 * PATCH /posts/:postId
 */
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, visibility } = req.body;

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author can edit
    if (post.authorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the author can edit this post' });
    }

    // Check edit window
    if (post.editWindowEnd && new Date(post.editWindowEnd) < new Date()) {
      return res.status(403).json({ message: 'Edit window has expired (48 hours)' });
    }

    if (content) post.content = content;
    if (visibility) post.visibility = visibility;
    post.editedAt = new Date();

    await post.save();

    return res.status(200).json({ message: 'Post updated successfully', post });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

/**
 * DELETE /posts/:postId
 */
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Author or church owner can delete
    const isAuthor = post.authorId.toString() === req.userId;
    let isOwner = false;
    if (post.churchId) {
      const church = await ChurchModel.findById(post.churchId).select('user');
      isOwner = church?.user._id.toString() === req.userId || false;
    }

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated comments and reactions
    await Promise.all([
      CommentModel.deleteMany({ postId }),
      ReactionModel.deleteMany({ targetType: 'post', targetId: postId }),
      PostModel.findByIdAndDelete(postId),
    ]);

    // Decrement user's post count for user-level posts
    if (!post.churchId) {
      await User.findByIdAndUpdate(post.authorId, { $inc: { postsCount: -1 } });
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

/**
 * POST /posts/:postId/pin
 */
export const togglePinPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only church owner/admin can pin church posts; user can pin own user-level posts
    if (post.churchId) {
      const church = await ChurchModel.findById(post.churchId).select('user');
      const isOwner = church?.user._id.toString() === req.userId;
      const isAdmin = await ChurchMembershipModel.findOne({
        userId: req.userId, churchId: post.churchId, role: { $in: ['owner', 'admin'] }, isApproved: true,
      });

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Only admins can pin posts' });
      }
    } else {
      // User-level post — only author can pin to their profile
      if (post.authorId.toString() !== req.userId) {
        return res.status(403).json({ message: 'Only the author can pin this post' });
      }
    }

    post.isPinned = !post.isPinned;
    await post.save();

    return res.status(200).json({
      message: post.isPinned ? 'Post pinned' : 'Post unpinned',
      isPinned: post.isPinned,
    });
  } catch (error: any) {
    console.error('Error toggling pin:', error);
    return res.status(500).json({ message: 'Failed to toggle pin', error: error.message });
  }
};

// ============================================================================
// REACTIONS
// ============================================================================

/**
 * POST /posts/:postId/react
 */
export const reactToPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { type } = req.body as { type: ReactionType };

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check existing reaction
    const existing = await ReactionModel.findOne({
      userId: req.userId, targetType: 'post', targetId: postId,
    });

    if (existing) {
      if (existing.type === type) {
        // Same reaction → remove it (toggle off)
        await existing.deleteOne();
        post.likesCount = Math.max(0, post.likesCount - 1);
        await post.save();
        return res.status(200).json({ message: 'Reaction removed', action: 'removed' });
      } else {
        // Different reaction → update it
        existing.type = type;
        await existing.save();
        return res.status(200).json({ message: 'Reaction updated', action: 'updated', type });
      }
    }

    // New reaction
    await ReactionModel.create({
      userId: req.userId,
      userName: `${user.name} ${user.surname || ''}`.trim(),
      userAvatar: user.avatar?.url || '',
      targetType: 'post',
      targetId: postId,
      type: type || 'like',
    });

    post.likesCount += 1;
    await post.save();

    // Emit notification to church (only for church posts)
    const actorName = `${user.name} ${user.surname || ''}`.trim();
    if (post.churchId) {
      emitSocialNotification({
        churchId: post.churchId.toString(),
        type: 'post_reaction',
        actorId: req.userId!,
        actorName,
        actorAvatar: user.avatar?.url,
        targetId: postId,
        targetType: 'post',
        message: `${actorName} reacted ${type} to your post`,
        meta: {
          reactionType: type,
          postSnippet: post.content?.text?.slice(0, 80),
        },
      });
    }

    // Notify post author (user-facing)
    emitUserNotification({
      recipientId: post.authorId.toString(),
      actorId: req.userId!,
      actorName,
      actorAvatar: user.avatar?.url,
      type: 'like',
      message: `${actorName} reacted to your post`,
      resourceType: 'post',
      resourceId: postId,
      meta: {
        reactionType: type,
        postSnippet: post.content?.text?.slice(0, 80),
      },
      groupKey: `like_${postId}`,
    });

    return res.status(201).json({ message: 'Reaction added', action: 'added', type });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Reaction already exists' });
    }
    console.error('Error reacting:', error);
    return res.status(500).json({ message: 'Failed to react', error: error.message });
  }
};

/**
 * GET /posts/:postId/reactions
 */
export const getPostReactions = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const reactions = await ReactionModel.find({
      targetType: 'post', targetId: postId,
    }).lean();

    const byType: Record<string, number> = {};
    for (const r of reactions) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }

    const sortedTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    let userReaction = null;
    if (req.userId) {
      const mine = reactions.find(r => r.userId.toString() === req.userId);
      userReaction = mine?.type || null;
    }

    return res.status(200).json({
      total: reactions.length,
      byType,
      topReactions: sortedTypes.slice(0, 3),
      userReaction,
      users: reactions.map(r => ({
        userId: r.userId.toString(),
        userName: r.userName,
        userAvatar: r.userAvatar || '',
        type: r.type,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching reactions:', error);
    return res.status(500).json({ message: 'Failed to fetch reactions', error: error.message });
  }
};

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * POST /posts/:postId/comments
 */
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { text, parentId, media } = req.body;

    if ((!text || !text.trim()) && (!media || media.length === 0)) {
      return res.status(400).json({ message: 'Comment text or media is required' });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Verify parent exists if replying
    if (parentId) {
      const parent = await CommentModel.findById(parentId);
      if (!parent || parent.postId.toString() !== postId) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const createPayload: any = {
      postId,
      userId: req.userId,
      userName: `${user.name} ${user.surname || ''}`.trim(),
      userAvatar: user.avatar?.url || '',
      parentId: parentId || null,
      text: (text || '').trim(),
    };

    if (media && Array.isArray(media) && media.length > 0) {
      createPayload.media = media;
    }

    const comment = await CommentModel.create(createPayload);

    // Increment comment count on post
    post.commentsCount += 1;
    await post.save();

    // Emit notification to church (only for church posts)
    const actorName = `${user.name} ${user.surname || ''}`.trim();
    if (post.churchId) {
      emitSocialNotification({
        churchId: post.churchId.toString(),
        type: 'post_comment',
        actorId: req.userId!,
        actorName,
        actorAvatar: user.avatar?.url,
        targetId: postId,
        targetType: 'post',
        message: `${actorName} commented on your post`,
        meta: {
          postSnippet: post.content?.text?.slice(0, 80),
          commentSnippet: text.trim().slice(0, 80),
        },
      });
    }

    // Notify post author (user-facing)
    emitUserNotification({
      recipientId: post.authorId.toString(),
      actorId: req.userId!,
      actorName,
      actorAvatar: user.avatar?.url,
      type: parentId ? 'comment_reply' : 'comment',
      message: parentId
        ? `${actorName} replied to your comment`
        : `${actorName} commented on your post`,
      resourceType: 'post',
      resourceId: postId,
      meta: {
        postSnippet: post.content?.text?.slice(0, 80),
        commentSnippet: text.trim().slice(0, 80),
      },
      groupKey: `comment_${postId}`,
    });

    // Process @mentions in comment and send notifications
    const mentions: Array<{ userId: string; username: string }> = Array.isArray(req.body.mentions)
      ? req.body.mentions.filter((m: any) => m.userId && m.userId !== req.userId)
      : [];
    if (mentions.length > 0) {
      const mentionRecipientIds = mentions.map((m: any) => m.userId);
      emitUserNotificationBatch(mentionRecipientIds, {
        actorId: req.userId!,
        actorName: actorName,
        actorAvatar: user.avatar?.url,
        type: 'mention',
        message: `${actorName} mentioned you in a comment`,
        resourceType: 'post',
        resourceId: postId,
        meta: {
          postSnippet: post.content?.text?.slice(0, 80),
          commentSnippet: text.trim().slice(0, 80),
        },
        groupKey: `mention_comment_${comment._id}`,
      });
    }

    return res.status(201).json({ message: 'Comment added', comment });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

/**
 * GET /posts/:postId/comments
 */
export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    // Get top-level comments
    const [comments, total] = await Promise.all([
      CommentModel.find({ postId, parentId: null })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommentModel.countDocuments({ postId, parentId: null }),
    ]);

    // Get replies for each comment (all replies, sorted chronologically)
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const [replies, repliesCount] = await Promise.all([
          CommentModel.find({ parentId: comment._id })
            .sort({ createdAt: 1 })
            .lean(),
          CommentModel.countDocuments({ parentId: comment._id }),
        ]);

        // Check if user liked each comment
        let userLiked = false;
        if (req.userId) {
          const reaction = await ReactionModel.findOne({
            userId: req.userId, targetType: 'comment', targetId: comment._id,
          });
          userLiked = !!reaction;
        }

        return { ...comment, replies, repliesCount, userLiked };
      })
    );

    return res.status(200).json({
      comments: commentsWithReplies,
      page,
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

/**
 * PATCH /comments/:commentId
 */
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the author can edit this comment' });
    }

    comment.text = text.trim();
    comment.editedAt = new Date();
    await comment.save();

    return res.status(200).json({ message: 'Comment updated', comment });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};

/**
 * DELETE /comments/:commentId
 */
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Author or post author can delete
    const post = await PostModel.findById(comment.postId);
    const isCommentAuthor = comment.userId.toString() === req.userId;
    const isPostAuthor = post?.authorId.toString() === req.userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete replies and reactions
    await Promise.all([
      CommentModel.deleteMany({ parentId: commentId }),
      ReactionModel.deleteMany({ targetType: 'comment', targetId: commentId }),
      comment.deleteOne(),
    ]);

    // Decrement comment count
    if (post) {
      const remainingCount = await CommentModel.countDocuments({ postId: post._id });
      post.commentsCount = remainingCount;
      await post.save();
    }

    return res.status(200).json({ message: 'Comment deleted' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

/**
 * POST /comments/:commentId/react
 */
export const reactToComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body as { type: ReactionType };

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const existing = await ReactionModel.findOne({
      userId: req.userId, targetType: 'comment', targetId: commentId,
    });

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        comment.likesCount = Math.max(0, comment.likesCount - 1);
        await comment.save();
        return res.status(200).json({ message: 'Reaction removed', action: 'removed' });
      } else {
        existing.type = type;
        await existing.save();
        return res.status(200).json({ message: 'Reaction updated', action: 'updated', type });
      }
    }

    await ReactionModel.create({
      userId: req.userId,
      userName: `${user.name} ${user.surname || ''}`.trim(),
      userAvatar: user.avatar?.url || '',
      targetType: 'comment',
      targetId: commentId,
      type: type || 'like',
    });

    comment.likesCount += 1;
    await comment.save();

    return res.status(201).json({ message: 'Reaction added', action: 'added', type });
  } catch (error: any) {
    console.error('Error reacting to comment:', error);
    return res.status(500).json({ message: 'Failed to react', error: error.message });
  }
};

// ============================================================================
// STATUSES
// ============================================================================

/**
 * POST /churches/:churchId/statuses
 */
export const createStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const { type, content, textBlocks, stickers, music } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: 'Status type and content are required' });
    }

    const church = await ChurchModel.findById(churchId).select('name logo image pageBlocks user');
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Verify authorization
    const isOwner = church.user._id.toString() === req.userId;
    const membership = await ChurchMembershipModel.findOne({
      userId: req.userId, churchId, role: { $in: ['owner', 'admin', 'moderator'] }, isApproved: true,
    });

    if (!isOwner && !membership) {
      return res.status(403).json({ message: 'Not authorized to create status for this church' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = await StatusModel.create({
      churchId,
      churchName: church.name,
      churchLogo: extractChurchLogo(church),
      authorId: req.userId,
      authorName: `${user.name} ${user.surname || ''}`.trim(),
      authorAvatar: user.avatar?.url || '',
      type,
      content,
      textBlocks: textBlocks || undefined,
      stickers: stickers || undefined,
      music: music || undefined,
      expiresAt,
    });

    return res.status(201).json({ message: 'Status created', status });
  } catch (error: any) {
    console.error('Error creating status:', error);
    return res.status(500).json({ message: 'Failed to create status', error: error.message });
  }
};

/**
 * POST /statuses  (user-level story — any authenticated user)
 */
export const createUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, textBlocks, stickers, music } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: 'Status type and content are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = await StatusModel.create({
      authorId: req.userId,
      authorName: `${user.name} ${user.surname || ''}`.trim(),
      authorAvatar: user.avatar?.url || '',
      isUserStatus: true,
      type,
      content,
      textBlocks: textBlocks || undefined,
      stickers: stickers || undefined,
      music: music || undefined,
      expiresAt,
    });

    return res.status(201).json({ message: 'Status created', status });
  } catch (error: any) {
    console.error('Error creating user status:', error);
    return res.status(500).json({ message: 'Failed to create status', error: error.message });
  }
};

/**
 * GET /churches/:churchId/statuses
 */
export const getChurchStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    const statuses = await StatusModel.find({
      churchId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Check which statuses the user has viewed
    const enriched = statuses.map(s => ({
      ...s,
      viewedByUser: req.userId ? s.viewers?.some((v: any) => v.toString() === req.userId) : false,
    }));

    return res.status(200).json({ statuses: enriched });
  } catch (error: any) {
    console.error('Error fetching statuses:', error);
    return res.status(500).json({ message: 'Failed to fetch statuses', error: error.message });
  }
};

/**
 * DELETE /statuses/:statusId
 */
export const deleteStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const status = await StatusModel.findById(statusId);

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    if (status.authorId.toString() !== req.userId) {
      const church = await ChurchModel.findById(status.churchId).select('user');
      if (church?.user._id.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    await status.deleteOne();
    return res.status(200).json({ message: 'Status deleted' });
  } catch (error: any) {
    console.error('Error deleting status:', error);
    return res.status(500).json({ message: 'Failed to delete status', error: error.message });
  }
};

/**
 * POST /statuses/:statusId/view
 */
export const viewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;

    const status = await StatusModel.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Only count view once per user
    if (!status.viewers.some((v: any) => v.toString() === req.userId)) {
      status.viewers.push(userId);
      status.viewsCount += 1;
      await status.save();
    }

    return res.status(200).json({ message: 'Status viewed', viewsCount: status.viewsCount });
  } catch (error: any) {
    console.error('Error viewing status:', error);
    return res.status(500).json({ message: 'Failed to view status', error: error.message });
  }
};

/**
 * POST /statuses/:statusId/react
 */
export const reactToStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const { type } = req.body;

    const status = await StatusModel.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Check if user already reacted
    const existingIndex = status.reactions.findIndex((r: any) => r.userId.toString() === req.userId);

    if (existingIndex !== -1) {
      if (status.reactions[existingIndex].type === type) {
        // Remove reaction
        status.reactions.splice(existingIndex, 1);
        await status.save();
        return res.status(200).json({ message: 'Reaction removed', action: 'removed' });
      } else {
        // Update reaction
        status.reactions[existingIndex].type = type;
        await status.save();
        return res.status(200).json({ message: 'Reaction updated', action: 'updated', type });
      }
    }

    // Add new reaction
    status.reactions.push({
      userId,
      type: type || 'like',
      createdAt: new Date(),
    });
    await status.save();

    return res.status(201).json({ message: 'Reaction added', action: 'added', type });
  } catch (error: any) {
    console.error('Error reacting to status:', error);
    return res.status(500).json({ message: 'Failed to react', error: error.message });
  }
};

/**
 * GET /statuses/:statusId/viewers
 * Returns list of users who viewed this status (with name + avatar).
 * Only the status author can see this.
 */
export const getStatusViewers = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;

    const status = await StatusModel.findById(statusId)
      .populate('viewers', 'name surname avatar image')
      .lean();

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Only the author can see who viewed
    if (status.authorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the author can view this' });
    }

    const viewers = (status.viewers || []).map((v: any) => ({
      _id: v._id?.toString() || v.toString(),
      name: v.name || '',
      surname: v.surname || '',
      avatar: v.avatar?.url || v.image || '',
    }));

    return res.status(200).json({ viewers, total: viewers.length });
  } catch (error: any) {
    console.error('Error fetching status viewers:', error);
    return res.status(500).json({ message: 'Failed to fetch viewers', error: error.message });
  }
};

/**
 * GET /statuses/:statusId/reactions
 * Returns list of reactions with user info.
 * Only the status author can see this.
 */
export const getStatusReactions = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;

    const status = await StatusModel.findById(statusId).lean();

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Only the author can see detailed reactions
    if (status.authorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the author can view this' });
    }

    const reactions = status.reactions || [];
    // Populate user info for each reactor
    const userIds = reactions.map((r: any) => r.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name surname avatar image')
      .lean();
    
    const userMap = new Map<string, any>();
    for (const u of users) {
      userMap.set(u._id.toString(), u);
    }

    const enrichedReactions = reactions.map((r: any) => {
      const u = userMap.get(r.userId.toString());
      return {
        userId: r.userId.toString(),
        type: r.type,
        createdAt: r.createdAt,
        name: u?.name || '',
        surname: u?.surname || '',
        avatar: u?.avatar?.url || u?.image || '',
      };
    });

    return res.status(200).json({ reactions: enrichedReactions, total: enrichedReactions.length });
  } catch (error: any) {
    console.error('Error fetching status reactions:', error);
    return res.status(500).json({ message: 'Failed to fetch reactions', error: error.message });
  }
};

// ============================================================================
// CHURCH MEMBERSHIP
// ============================================================================

/**
 * POST /churches/:churchId/join
 */
export const joinChurch = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    const church = await ChurchModel.findById(churchId).select('name');
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check existing membership
    const existing = await ChurchMembershipModel.findOne({
      userId: req.userId, churchId,
    });
    if (existing) {
      return res.status(409).json({
        message: existing.isApproved ? 'Already a member' : 'Membership request pending',
      });
    }

    const membership = await ChurchMembershipModel.create({
      userId: req.userId,
      userName: `${user.name} ${user.surname || ''}`.trim(),
      userEmail: user.email,
      userAvatar: user.avatar?.url || '',
      churchId,
      churchName: church.name,
      role: 'member',
      isApproved: true, // Auto-approve for now; can be changed to require admin approval
    });

    // Emit notification to church
    const actorName = `${user.name} ${user.surname || ''}`.trim();
    emitSocialNotification({
      churchId,
      type: 'new_member',
      actorId: req.userId!,
      actorName,
      actorAvatar: user.avatar?.url,
      message: `${actorName} joined your church community`,
    });

    return res.status(201).json({ message: 'Joined church successfully', membership });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already a member' });
    }
    console.error('Error joining church:', error);
    return res.status(500).json({ message: 'Failed to join church', error: error.message });
  }
};

/**
 * DELETE /churches/:churchId/leave
 */
export const leaveChurch = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    const membership = await ChurchMembershipModel.findOne({
      userId: req.userId, churchId,
    });

    if (!membership) {
      return res.status(404).json({ message: 'Not a member of this church' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ message: 'Owners cannot leave their church. Transfer ownership first.' });
    }

    await membership.deleteOne();
    return res.status(200).json({ message: 'Left church successfully' });
  } catch (error: any) {
    console.error('Error leaving church:', error);
    return res.status(500).json({ message: 'Failed to leave church', error: error.message });
  }
};

/**
 * GET /churches/:churchId/members
 */
export const getChurchMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      ChurchMembershipModel.find({ churchId, isApproved: true })
        .sort({ role: 1, joinedAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChurchMembershipModel.countDocuments({ churchId, isApproved: true }),
    ]);

    return res.status(200).json({
      members,
      page,
      totalPages: Math.ceil(total / limit),
      totalMembers: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ message: 'Failed to fetch members', error: error.message });
  }
};

/**
 * PATCH /churches/:churchId/members/:userId/role
 */
export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'moderator', 'editor', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Only owner can change roles
    const church = await ChurchModel.findById(churchId).select('user');
    if (!church || church.user._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the church owner can change roles' });
    }

    const membership = await ChurchMembershipModel.findOneAndUpdate(
      { userId, churchId },
      { role },
      { new: true }
    );

    if (!membership) {
      return res.status(404).json({ message: 'Member not found' });
    }

    return res.status(200).json({ message: 'Role updated', membership });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

// ============================================================================
// HOME FEED (aggregated from followed churches + followed users)
// ============================================================================

/**
 * GET /feed
 * Returns posts from:
 *  1. Churches the user is a member of (church posts)
 *  2. Users the current user follows (user-level posts)
 *  3. If no memberships and no follows → all public posts
 */
export const getHomeFeed = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const feedType = (req.query.feedType as string) || 'following'; // 'following' | 'foryou'
    const tag = req.query.tag as string | undefined;  // topic filter

    // Base tag filter (applied to both feed types)
    const tagFilter: any = {};
    if (tag && tag !== 'all') {
      tagFilter.tags = tag;
    }

    let filter: any;
    let sortOrder: any;

    if (feedType === 'foryou') {
      // ── FOR YOU: public posts ranked by engagement ──────────────
      filter = {
        visibility: 'public',
        type: { $ne: 'status' }, // exclude ephemeral statuses
        ...tagFilter,
      };
      // Sort by engagement score (likes + comments + shares), then recency
      sortOrder = { isPinned: -1, likesCount: -1, commentsCount: -1, createdAt: -1 };
    } else {
      // ── FOLLOWING: personalised chronological feed ──────────────
      // Get churches the user follows
      const memberships = await ChurchMembershipModel.find({
        userId: req.userId, isApproved: true,
      }).select('churchId').lean();

      const churchIds = memberships.map(m => m.churchId);

      // Get users the current user follows (for user-level posts)
      let followedUserIds: mongoose.Types.ObjectId[] = [];
      try {
        const { FollowModel } = require("../models/Follow");
        const follows = await FollowModel.find({ followerId: req.userId })
          .select('followingId').lean();
        followedUserIds = follows.map((f: any) => f.followingId);
      } catch {
        // Follow model may not exist yet — gracefully degrade
      }

      // Build filter: church posts from memberships OR user-level posts from follows OR own posts
      const orConditions: any[] = [];

      if (churchIds.length > 0) {
        orConditions.push({
          churchId: { $in: churchIds },
          visibility: { $in: ['public', 'members'] },
          ...tagFilter,
        });
      }

      // User-level posts (no churchId) from followed users + own user-level posts
      const userPostAuthorIds = [...followedUserIds];
      if (req.userId) {
        userPostAuthorIds.push(new mongoose.Types.ObjectId(req.userId));
      }
      if (userPostAuthorIds.length > 0) {
        orConditions.push({
          churchId: { $exists: false },
          authorId: { $in: userPostAuthorIds },
          visibility: 'public',
          ...tagFilter,
        });
        // Also match churchId: null
        orConditions.push({
          churchId: null,
          authorId: { $in: userPostAuthorIds },
          visibility: 'public',
          ...tagFilter,
        });
      }

      // Fallback: if no follows and no memberships, show all public posts
      if (orConditions.length > 0) {
        orConditions.push({ visibility: 'public', ...tagFilter });
        filter = { $or: orConditions };
      } else {
        filter = { visibility: 'public', ...tagFilter };
      }

      sortOrder = { isPinned: -1, createdAt: -1 };
    }

    const [posts, total] = await Promise.all([
      PostModel.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments(filter),
    ]);

    // Attach user reactions (with byType breakdown) and bookmark status
    const postIds = posts.map(p => p._id);

    const [userReactions, allReactions, userBookmarks] = await Promise.all([
      ReactionModel.find({
        userId: req.userId, targetType: 'post', targetId: { $in: postIds },
      }).lean(),
      ReactionModel.find({
        targetType: 'post', targetId: { $in: postIds },
      }).lean(),
      BookmarkModel.find({
        userId: req.userId, postId: { $in: postIds },
      }).select('postId').lean(),
    ]);

    const reactionMap = new Map(userReactions.map(r => [r.targetId.toString(), r.type]));
    const bookmarkSet = new Set(userBookmarks.map(b => b.postId.toString()));

    // Build byType map: postId -> { like: 2, love: 1, ... }
    const byTypeMap = new Map<string, Record<string, number>>();
    for (const r of allReactions) {
      const pid = r.targetId.toString();
      if (!byTypeMap.has(pid)) byTypeMap.set(pid, {});
      const counts = byTypeMap.get(pid)!;
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    // Backfill churchLogo for posts that have a churchId but missing logo
    const churchPostsMissingLogo = posts.filter(p => p.churchId && !p.churchLogo);
    const churchLogoMap = new Map<string, string>();
    if (churchPostsMissingLogo.length > 0) {
      const uniqueChurchIds = [...new Set(churchPostsMissingLogo.map(p => p.churchId!.toString()))];
      const churches = await ChurchModel.find({ _id: { $in: uniqueChurchIds } })
        .select('logo image pageBlocks')
        .lean();
      for (const c of churches) {
        const logo = extractChurchLogo(c);
        if (logo) churchLogoMap.set(c._id.toString(), logo);
      }
    }

    const enrichedPosts = posts.map(p => ({
      ...p,
      churchLogo: p.churchLogo || (p.churchId ? churchLogoMap.get(p.churchId.toString()) || '' : ''),
      isBookmarked: bookmarkSet.has(p._id.toString()),
      reactions: {
        total: p.likesCount,
        userReaction: reactionMap.get(p._id.toString()) || null,
        byType: byTypeMap.get(p._id.toString()) || {},
      },
      canEdit: p.authorId.toString() === req.userId && p.editWindowEnd && new Date(p.editWindowEnd) > new Date(),
    }));

    return res.status(200).json({
      posts: enrichedPosts,
      page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    return res.status(500).json({ message: 'Failed to fetch feed', error: error.message });
  }
};

/**
 * GET /statuses/feed
 * Get statuses from all followed churches
 */
export const getStatusesFeed = async (req: AuthRequest, res: Response) => {
  try {
    // ─── Church statuses (from memberships) ───────────────
    const memberships = await ChurchMembershipModel.find({
      userId: req.userId, isApproved: true,
    }).select('churchId churchName').lean();

    const churchIds = memberships.map(m => m.churchId);

    const churchStatuses = await StatusModel.find({
      isUserStatus: { $ne: true },
      churchId: { $in: churchIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    // ─── User statuses (own + from followed users) ───────
    const { FollowModel } = require("../models/Follow");
    const follows = await FollowModel.find({ followerId: req.userId })
      .select('followingId')
      .lean();
    const followedUserIds = follows.map((f: any) => f.followingId);

    // Include the current user's own stories too
    const userStatusAuthors = [req.userId, ...followedUserIds];

    const userStatuses = await StatusModel.find({
      isUserStatus: true,
      authorId: { $in: userStatusAuthors },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    // ─── Build groups ────────────────────────────────────
    const groupMap = new Map<string, any>();

    // Group church statuses by churchId
    for (const status of churchStatuses) {
      const cId = status.churchId!.toString();
      if (!groupMap.has(cId)) {
        groupMap.set(cId, {
          churchId: cId,
          churchName: status.churchName || '',
          churchLogo: status.churchLogo || '',
          statuses: [],
          hasUnseen: false,
          latestAt: status.createdAt,
          isUserStory: false,
        });
      }
      const group = groupMap.get(cId);
      group.statuses.push({
        ...status,
        viewedByUser: status.viewers?.some((v: any) => v.toString() === req.userId) || false,
      });
      if (!status.viewers?.some((v: any) => v.toString() === req.userId)) {
        group.hasUnseen = true;
      }
    }

    // Group user statuses by authorId (each user = one story group)
    for (const status of userStatuses) {
      const key = `user_${status.authorId.toString()}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          churchId: key,                    // reuse key as groupId
          churchName: status.authorName,    // display name
          churchLogo: status.authorAvatar || '',
          statuses: [],
          hasUnseen: false,
          latestAt: status.createdAt,
          isUserStory: true,
          authorId: status.authorId.toString(),
        });
      }
      const group = groupMap.get(key);
      group.statuses.push({
        ...status,
        viewedByUser: status.viewers?.some((v: any) => v.toString() === req.userId) || false,
      });
      if (!status.viewers?.some((v: any) => v.toString() === req.userId)) {
        group.hasUnseen = true;
      }
    }

    // Sort: own stories first, then unseen, then by recency
    const groups = Array.from(groupMap.values()).sort((a, b) => {
      // Own user story always first
      const aIsOwn = a.isUserStory && a.authorId === req.userId;
      const bIsOwn = b.isUserStory && b.authorId === req.userId;
      if (aIsOwn !== bIsOwn) return aIsOwn ? -1 : 1;
      // Unseen next
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });

    return res.status(200).json({ statusGroups: groups });
  } catch (error: any) {
    console.error('Error fetching status feed:', error);
    return res.status(500).json({ message: 'Failed to fetch statuses', error: error.message });
  }
};

// ============================================================================
// BOOKMARKS / SAVED POSTS
// ============================================================================

/**
 * POST /posts/:postId/bookmark
 * Toggle bookmark on a post. If already bookmarked, removes it.
 */
export const toggleBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const post = await PostModel.findById(postId).select('churchId');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already bookmarked
    const existing = await BookmarkModel.findOne({ userId, postId });

    if (existing) {
      await BookmarkModel.deleteOne({ _id: existing._id });
      return res.status(200).json({ bookmarked: false, message: 'Bookmark removed' });
    }

    await BookmarkModel.create({
      userId,
      postId,
      churchId: post.churchId || undefined,
    });

    return res.status(201).json({ bookmarked: true, message: 'Post bookmarked' });
  } catch (error: any) {
    console.error('Error toggling bookmark:', error);
    return res.status(500).json({ message: 'Failed to toggle bookmark', error: error.message });
  }
};

/**
 * GET /bookmarks
 * Get user's bookmarked posts (paginated), with full post data.
 */
export const getBookmarks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      BookmarkModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookmarkModel.countDocuments({ userId }),
    ]);

    // Fetch full posts for the bookmarks
    const postIds = bookmarks.map(b => b.postId);
    const posts = await PostModel.find({ _id: { $in: postIds } }).lean();

    // Preserve bookmark order
    const postMap = new Map(posts.map(p => [p._id.toString(), p]));
    const orderedPosts = bookmarks
      .map(b => {
        const post = postMap.get(b.postId.toString());
        if (!post) return null;
        return {
          ...post,
          bookmarkedAt: b.createdAt,
        };
      })
      .filter(Boolean);

    // Enrich with user reactions
    const userReactions = await ReactionModel.find({
      userId,
      targetType: 'post',
      targetId: { $in: postIds },
    }).lean();

    const reactionMap = new Map(
      userReactions.map(r => [r.targetId.toString(), r.type])
    );

    const enrichedPosts = orderedPosts.map((post: any) => ({
      ...post,
      reactions: {
        userReaction: reactionMap.get(post._id.toString()) || null,
      },
      isBookmarked: true,
    }));

    return res.status(200).json({
      posts: enrichedPosts,
      total,
      page,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    return res.status(500).json({ message: 'Failed to fetch bookmarks', error: error.message });
  }
};

/**
 * GET /posts/:postId/bookmark
 * Check if the current user has bookmarked a specific post.
 */
export const checkBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const existing = await BookmarkModel.findOne({ userId, postId });
    return res.status(200).json({ bookmarked: !!existing });
  } catch (error: any) {
    console.error('Error checking bookmark:', error);
    return res.status(500).json({ message: 'Failed to check bookmark', error: error.message });
  }
};
