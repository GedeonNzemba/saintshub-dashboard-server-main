/**
 * Message Model
 *
 * A single message within a Conversation. Supports text and optional
 * media attachments (images, files). Read-receipts tracked via readBy array.
 */
import mongoose, { Document, Schema } from "mongoose";

export interface MessageDoc extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text?: string;
  media?: {
    url: string;
    type: "image" | "video" | "audio" | "file";
    name?: string;
    duration?: number;  // seconds, for audio/video
  }[];
  replyTo?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const MessageSchema = new Schema<MessageDoc>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      maxlength: 5000,
      default: "",
    },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video", "audio", "file"], default: "image" },
        name: { type: String },
        duration: { type: Number },
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Paginated message history within a conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel = mongoose.model<MessageDoc>(
  "Message",
  MessageSchema
);
