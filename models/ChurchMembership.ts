import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export type MemberRole = 'owner' | 'admin' | 'moderator' | 'editor' | 'member';

export interface ChurchMembershipDoc extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  churchId: mongoose.Types.ObjectId;
  churchName: string;
  role: MemberRole;
  isApproved: boolean;
  joinedAt: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const ChurchMembershipSchema = new Schema<ChurchMembershipDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userAvatar: { type: String },

    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
    },
    churchName: { type: String, required: true },

    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'editor', 'member'],
      default: 'member',
      required: true,
    },

    isApproved: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one membership per user per church
ChurchMembershipSchema.index({ userId: 1, churchId: 1 }, { unique: true });

// Get all members of a church
ChurchMembershipSchema.index({ churchId: 1, role: 1, isApproved: 1 });

// Get all churches a user belongs to
ChurchMembershipSchema.index({ userId: 1, isApproved: 1 });

export const ChurchMembershipModel = mongoose.model<ChurchMembershipDoc>(
  'ChurchMembership',
  ChurchMembershipSchema
);
