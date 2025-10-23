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
  role?: 'Pastor' | 'IT' | 'Admin' | 'Member'; // User role for admin requests
  // Church selection during signup - stores church ID or custom church name
  // Used when pastor/IT staff signup to indicate their church affiliation
  // This helps admins verify and associate users with correct churches
  churchSelection?: string;
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, // Index for fast email lookups
  password: { type: String, required: true },
  admin: { type: Boolean, default: false, index: true }, // Index for admin queries
  avatar: {
    public_id: { type: String, required: false },
    url: { type: String, required: true },
  },
  language: { type: String, enum: ['en', 'fr'], required: true },
  isAdminCandidate: { type: Boolean, default: false },
  role: { type: String, enum: ['Pastor', 'IT', 'Admin', 'Member'], required: false },
  churchSelection: { type: String, required: false },
  passwordResetToken: { type: String, required: false, select: false }, // Don't return by default
  passwordResetExpires: { type: Date, required: false, select: false },
}, { timestamps: true });

// Compound index for common queries (find users by email and admin status)
UserSchema.index({ email: 1, admin: 1 });

export default mongoose.model<UserDocument>("User", UserSchema);
