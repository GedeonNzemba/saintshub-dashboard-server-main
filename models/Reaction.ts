import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export type ReactionType = 'like' | 'love' | 'pray' | 'amen' | 'celebrate';

export interface ReactionDoc extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  targetType: 'post' | 'comment' | 'status';
  targetId: mongoose.Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const ReactionSchema = new Schema<ReactionDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'status'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'love', 'pray', 'amen', 'celebrate'],
      required: true,
      default: 'like',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique constraint: one reaction per user per target
ReactionSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// Efficient lookup of all reactions on a target
ReactionSchema.index({ targetType: 1, targetId: 1 });

// User's reactions
ReactionSchema.index({ userId: 1, createdAt: -1 });

export const ReactionModel = mongoose.model<ReactionDoc>('Reaction', ReactionSchema);
