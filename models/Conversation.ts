/**
 * Conversation Model
 *
 * Represents a 1-to-1 direct message thread between two users.
 * Stores participant IDs, a denormalized last-message snapshot
 * for efficient inbox rendering, and per-user unread counts.
 */
import mongoose, { Document, Schema } from "mongoose";

export interface ConversationDoc extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  /** Per-participant unread counts keyed by stringified userId */
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<ConversationDoc>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: (v: any[]) => v.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
      required: true,
    },
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Efficient lookup: "all conversations for a user"
ConversationSchema.index({ participants: 1, updatedAt: -1 });
// Ensure only one conversation per unique pair (sorted IDs handled in controller)
ConversationSchema.index(
  { participants: 1 },
  {
    unique: true,
    partialFilterExpression: { "participants.1": { $exists: true } },
  }
);

export const ConversationModel = mongoose.model<ConversationDoc>(
  "Conversation",
  ConversationSchema
);
