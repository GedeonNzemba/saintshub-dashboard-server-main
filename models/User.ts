// src/models/User.ts
/**
 * User Model
 * 
 * Purpose: Defines the structure and validation for user accounts
 * 
 * Fields Explanation:
 * - churchSelection: Stores the church ID or name that user selected during signup
 *   (Used for admin candidates to indicate which church they want to manage)
 * 
 * Note: The actual churches created by a user are stored in the Church model
 * with a reference to the user. To get user's churches, query the Church collection.
 */
import mongoose, { Document, Schema } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  surname: string;
  email: string;
  password: string;
  admin: boolean;
  avatar: {
    public_id: string;
    url: string;
  };
  language: 'en' | 'fr';
  isAdminCandidate: boolean;
  role?: 'Pastor' | 'IT' | 'Admin' | 'Member';
  churchSelection?: string;

  // ── Social profile fields ──────────────────────────────
  username?: string;
  bio?: string;
  coverPhoto?: string;
  website?: string;
  location?: string;
  pronouns?: string;
  dateOfBirth?: Date;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  likesCount: number;

  // Storage plan
  storagePlan: 'free' | 'basic' | 'pro' | 'unlimited';
  // Pending upgrade request — set when user submits a plan upgrade request, cleared when admin processes it
  pendingUpgradeRequest?: {
    requestedPlan: 'basic' | 'pro' | 'unlimited';
    reason?: string;
    requestedAt: Date;
  };
  // Result of an admin's approve/reject — stored until user acknowledges it in the app
  upgradeRequestResult?: {
    status: 'approved' | 'rejected';
    previousPlan: string;
    newPlan: string;
    requestedPlan: string;
    resolvedAt: Date;
  };
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false, index: true },
  avatar: {
    public_id: { type: String, required: false },
    url: { type: String, required: true },
  },
  language: { type: String, enum: ['en', 'fr'], required: true },
  isAdminCandidate: { type: Boolean, default: false },
  role: { type: String, enum: ['Pastor', 'IT', 'Admin', 'Member'], required: false },
  churchSelection: { type: String, required: false },

  // ── Social profile fields ──────────────────────────────
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true, maxlength: 30 },
  bio: { type: String, maxlength: 300, default: '' },
  coverPhoto: { type: String, default: '' },
  website: { type: String, maxlength: 200, default: '' },
  location: { type: String, maxlength: 100, default: '' },
  pronouns: { type: String, maxlength: 30, default: '' },
  dateOfBirth: { type: Date },
  isPrivate: { type: Boolean, default: false },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },

  storagePlan: { type: String, enum: ['free', 'basic', 'pro', 'unlimited'], default: 'free' },
  pendingUpgradeRequest: {
    requestedPlan: { type: String, enum: ['basic', 'pro', 'unlimited'] },
    reason: { type: String, default: '' },
    requestedAt: { type: Date },
  },
  upgradeRequestResult: {
    status: { type: String, enum: ['approved', 'rejected'] },
    previousPlan: { type: String },
    newPlan: { type: String },
    requestedPlan: { type: String },
    resolvedAt: { type: Date },
  },
  passwordResetToken: { type: String, required: false, select: false }, // Don't return by default
  passwordResetExpires: { type: Date, required: false, select: false },
}, { timestamps: true });

// Compound index for common queries (find users by email and admin status)
UserSchema.index({ email: 1, admin: 1 });
UserSchema.index({ name: 'text', surname: 'text', username: 'text', bio: 'text' }, { weights: { username: 10, name: 5, surname: 5, bio: 2 }, name: 'user_text_search' }); // Full-text search

export default mongoose.model<UserDocument>("User", UserSchema);
