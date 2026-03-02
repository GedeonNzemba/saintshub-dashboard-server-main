import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export interface BookmarkDoc extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  churchId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const BookmarkSchema = new Schema<BookmarkDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique constraint: one bookmark per user per post
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Get all bookmarks for a user (latest first)
BookmarkSchema.index({ userId: 1, createdAt: -1 });

// Check if a specific post is bookmarked by user
BookmarkSchema.index({ userId: 1, postId: 1, createdAt: -1 });

export const BookmarkModel = mongoose.model<BookmarkDoc>('Bookmark', BookmarkSchema);
