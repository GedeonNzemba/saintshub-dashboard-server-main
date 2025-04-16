// src/models/User.ts
import mongoose, { Document, Schema } from "mongoose";

export interface DocumentsDocument extends Document {
  title: string;
  url: string;
}

const DocumentsSchema = new Schema<DocumentsDocument>({
  title: { type: String, required: true },
  url: { type: String, required: true },
});

export default mongoose.model<DocumentsDocument>("Banner", DocumentsSchema);
