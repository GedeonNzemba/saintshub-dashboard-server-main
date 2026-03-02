import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: string;
}

export interface PostDoc extends Document {
  churchId?: mongoose.Types.ObjectId;
  churchName?: string;
  churchLogo?: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;

  type: 'post' | 'status' | 'announcement';
  tags: string[];
  content: {
    text?: string;
    media?: PostMedia[];
  };

  visibility: 'public' | 'members' | 'draft';
  isPinned: boolean;

  likesCount: number;
  commentsCount: number;
  sharesCount: number;

  // Original post (if shared)
  sharedFrom?: {
    postId: mongoose.Types.ObjectId;
    authorName: string;
    churchName: string;
  };

  editedAt?: Date;
  editWindowEnd?: Date; // 48 hours after creation

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const PostSchema = new Schema<PostDoc>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: false,
      index: true,
      sparse: true,
    },
    churchName: { type: String, required: false },
    churchLogo: { type: String },

    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    authorRole: { type: String },

    type: {
      type: String,
      enum: ['post', 'status', 'announcement'],
      default: 'post',
      required: true,
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    content: {
      text: { type: String, maxlength: 5000 },
      media: [{
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
        url: { type: String, required: true },
        thumbnail: { type: String },
        width: { type: Number },
        height: { type: Number },
        duration: { type: String },
      }],
    },

    visibility: {
      type: String,
      enum: ['public', 'members', 'draft'],
      default: 'public',
    },

    isPinned: { type: Boolean, default: false },

    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },

    sharedFrom: {
      postId: { type: Schema.Types.ObjectId, ref: 'Post' },
      authorName: { type: String },
      churchName: { type: String },
    },

    editedAt: { type: Date },
    editWindowEnd: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
PostSchema.index({ churchId: 1, createdAt: -1 }); // Church feed
PostSchema.index({ churchId: 1, isPinned: -1, createdAt: -1 }); // Pinned first
PostSchema.index({ authorId: 1, createdAt: -1 }); // User's posts
PostSchema.index({ visibility: 1, createdAt: -1 }); // Public feed
PostSchema.index({ type: 1, churchId: 1 }); // Filter by type
PostSchema.index({ tags: 1, createdAt: -1 }); // Filter by tags
PostSchema.index({ 'content.text': 'text', tags: 'text' }, { weights: { 'content.text': 10, tags: 5 }, name: 'post_text_search' }); // Full-text search

// Set edit window (48 hours) on creation
PostSchema.pre('save', function (next) {
  if (this.isNew && !this.editWindowEnd) {
    const editWindow = new Date(this.createdAt || Date.now());
    editWindow.setHours(editWindow.getHours() + 48);
    this.editWindowEnd = editWindow;
  }
  next();
});

export const PostModel = mongoose.model<PostDoc>('Post', PostSchema);
