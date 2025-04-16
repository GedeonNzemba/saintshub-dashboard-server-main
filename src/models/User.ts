// src/models/User.ts
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
  churchSelection?: string;
}

const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false },
  avatar: {
    public_id: { type: String, required: false },
    url: { type: String, required: true },
  },
  language: { type: String, enum: ['en', 'fr'], required: true },
  isAdminCandidate: { type: Boolean, default: false },
  churchSelection: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model<UserDocument>("User", UserSchema);
