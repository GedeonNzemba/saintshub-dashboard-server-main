import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export interface CommentDoc extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  parentId?: mongoose.Types.ObjectId; // for nested replies
  text: string;
  media?: Array<{ url: string; type: 'image' }>;
  likesCount: number;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const CommentSchema = new Schema<CommentDoc>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    text: {
      type: String,
      default: '',
      maxlength: 2000,
      trim: true,
    },
    media: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['image'], default: 'image' },
    }],
    likesCount: { type: Number, default: 0 },
    editedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
CommentSchema.index({ postId: 1, createdAt: 1 }); // Comments on a post (chronological)
CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 }); // Threaded comments
CommentSchema.index({ userId: 1, createdAt: -1 }); // User's comments

export const CommentModel = mongoose.model<CommentDoc>('Comment', CommentSchema);
