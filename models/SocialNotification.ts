import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export type SocialNotificationType =
  | 'post_reaction'      // Someone reacted to church post
  | 'post_comment'       // Someone commented on church post
  | 'comment_reaction'   // Someone reacted to a comment
  | 'post_share'         // Someone shared a church post
  | 'status_reaction'    // Someone reacted to church status
  | 'status_view'        // Someone viewed church status
  | 'new_member'         // Someone joined the church
  | 'member_left';       // Someone left the church

export interface SocialNotificationDoc extends Document {
  /** The church that receives this notification */
  churchId: mongoose.Types.ObjectId;

  /** The type of activity */
  type: SocialNotificationType;

  /** The user who performed the action */
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorAvatar?: string;

  /** Reference to the target object */
  targetId?: mongoose.Types.ObjectId;
  targetType?: 'post' | 'comment' | 'status';

  /** Human-readable summary, e.g. "John liked your post" */
  message: string;

  /** Extra metadata (reaction type, post snippet, etc.) */
  meta?: {
    reactionType?: string;
    postSnippet?: string;
    commentSnippet?: string;
  };

  /** Whether the church admin has seen this notification */
  read: boolean;

  createdAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const SocialNotificationSchema = new Schema<SocialNotificationDoc>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'post_reaction',
        'post_comment',
        'comment_reaction',
        'post_share',
        'status_reaction',
        'status_view',
        'new_member',
        'member_left',
      ],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: { type: String, required: true },
    actorAvatar: { type: String },

    targetId: { type: Schema.Types.ObjectId },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'status'],
    },

    message: { type: String, required: true },

    meta: {
      reactionType: { type: String },
      postSnippet: { type: String },
      commentSnippet: { type: String },
    },

    read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for efficient queries
SocialNotificationSchema.index({ churchId: 1, createdAt: -1 }); // Latest notifications for a church
SocialNotificationSchema.index({ churchId: 1, read: 1, createdAt: -1 }); // Unread first
SocialNotificationSchema.index({ churchId: 1, type: 1, createdAt: -1 }); // Filter by type

// Auto-delete very old notifications (90 days)
SocialNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const SocialNotificationModel = mongoose.model<SocialNotificationDoc>(
  'SocialNotification',
  SocialNotificationSchema
);
