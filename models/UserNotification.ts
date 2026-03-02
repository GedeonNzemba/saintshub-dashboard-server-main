import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// TYPES
// ============================================================================

export type UserNotificationType =
  | 'follow'            // Someone followed you
  | 'follow_request'    // Someone requested to follow you (private account)
  | 'follow_request_accepted' // Your follow request was accepted
  | 'message'           // Someone sent you a direct message
  | 'like'              // Someone liked your post
  | 'comment'           // Someone commented on your post
  | 'comment_reply'     // Someone replied to your comment
  | 'mention'           // Someone mentioned you in a post/comment
  | 'repost'            // Someone shared/reposted your post
  | 'post_from_following' // Someone you follow posted
  | 'membership_approved' // Your church membership was approved
  | 'church_post'       // A church you follow posted
  | 'welcome';          // Welcome notification for new users

// ============================================================================
// INTERFACE
// ============================================================================

export interface UserNotificationDoc extends Document {
  recipientId: mongoose.Types.ObjectId; // The user who receives this notification
  actorId: mongoose.Types.ObjectId;     // The user who triggered it
  actorName: string;
  actorAvatar?: string;
  type: UserNotificationType;
  message: string;                       // Human-readable text
  resourceType?: 'post' | 'comment' | 'user' | 'church';
  resourceId?: mongoose.Types.ObjectId;  // The post/comment/user/church ID
  meta?: {
    postSnippet?: string;    // First ~80 chars of the post
    commentSnippet?: string; // First ~80 chars of the comment
    reactionType?: string;   // like, love, pray, etc.
    churchName?: string;     // Church name if church-related
    churchId?: string;       // Church ID for navigation
  };
  read: boolean;
  groupKey?: string;          // For grouping (e.g. "like_<postId>" to batch "5 people liked")
  createdAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const UserNotificationSchema = new Schema<UserNotificationDoc>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: { type: String, required: true },
    actorAvatar: { type: String },

    type: {
      type: String,
      enum: [
        'follow', 'follow_request', 'follow_request_accepted', 'message',
        'like', 'comment', 'comment_reply', 'mention',
        'repost', 'post_from_following', 'membership_approved',
        'church_post', 'welcome',
      ],
      required: true,
    },

    message: { type: String, required: true },

    resourceType: {
      type: String,
      enum: ['post', 'comment', 'user', 'church'],
    },
    resourceId: { type: Schema.Types.ObjectId },

    meta: {
      postSnippet: { type: String },
      commentSnippet: { type: String },
      reactionType: { type: String },
      churchName: { type: String },
      churchId: { type: String },
    },

    read: { type: Boolean, default: false },
    groupKey: { type: String, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
UserNotificationSchema.index({ recipientId: 1, createdAt: -1 });              // Feed: latest first
UserNotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });     // Unread first
UserNotificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });     // Filter by type
UserNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-delete after 90 days

export const UserNotificationModel = mongoose.model<UserNotificationDoc>(
  'UserNotification',
  UserNotificationSchema
);
