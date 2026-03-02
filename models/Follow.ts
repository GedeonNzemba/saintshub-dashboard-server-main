/**
 * Follow Model
 *
 * Tracks user-to-user follow relationships.
 * - followerId: the user who initiated the follow
 * - followingId: the user being followed
 *
 * Unique constraint prevents duplicate follow entries.
 * Counter caches on User model (followersCount, followingCount) are
 * incremented/decremented by the controller on follow/unfollow.
 */
import mongoose, { Document, Schema } from "mongoose";

export interface FollowDoc extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  status: 'approved' | 'pending';
  createdAt: Date;
}

const FollowSchema = new Schema<FollowDoc>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['approved', 'pending'],
      default: 'approved',
      index: true,
    },
  },
  { timestamps: true }
);

// One follow per unique pair
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Efficient "who follows me" / "who do I follow" queries
FollowSchema.index({ followingId: 1, createdAt: -1 }); // followers list
FollowSchema.index({ followerId: 1, createdAt: -1 }); // following list

export const FollowModel = mongoose.model<FollowDoc>("Follow", FollowSchema);
