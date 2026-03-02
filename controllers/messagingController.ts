/**
 * Messaging Controller
 *
 * Handles 1-to-1 direct messaging between users.
 * - Get or create a conversation with another user
 * - List all conversations (inbox)
 * - Send a message
 * - Get paginated message history
 * - Mark messages as read
 * - Get total unread count (for badge)
 * - Delete a conversation
 */
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";
import { emitUserNotification } from "../utils/userNotifications";

interface AuthRequest extends Request {
  userId?: string;
  params: any;
  body: any;
  query: any;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/messages/conversations  — Get or create a conversation
// Body: { recipientId: string }
// ═════════════════════════════════════════════════════════════════════════════

export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { recipientId } = req.body;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Valid recipientId is required" });
    }

    if (userId === recipientId) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const recipient = await User.findById(recipientId).select("_id name surname avatar").lean();
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sort participant IDs to ensure consistent ordering (prevents duplicate conversations)
    const participantIds = [userId, recipientId].sort().map(id => new mongoose.Types.ObjectId(id));

    // Find existing or create new
    let conversation = await ConversationModel.findOne({
      participants: { $all: participantIds, $size: 2 },
    });

    if (!conversation) {
      conversation = await ConversationModel.create({
        participants: participantIds,
        unreadCounts: new Map(),
      });
    }

    // Populate participant info
    const populatedConvo = await ConversationModel.findById(conversation._id)
      .populate("participants", "_id name surname avatar username")
      .lean();

    return res.status(200).json({ conversation: populatedConvo });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({ message: "Failed to create conversation", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/messages/conversations  — List user's conversations (inbox)
// ═════════════════════════════════════════════════════════════════════════════

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const filter = { participants: new mongoose.Types.ObjectId(userId) };

    const [conversations, total] = await Promise.all([
      ConversationModel.find(filter)
        .populate("participants", "_id name surname avatar username")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ConversationModel.countDocuments(filter),
    ]);

    // Attach unread count for current user + recipient read status
    const mapped = conversations.map((c: any) => {
      const myUnread = c.unreadCounts?.get?.(userId) ?? c.unreadCounts?.[userId] ?? 0;

      // Find the other participant to check if they've read the last message
      const otherParticipant = c.participants?.find(
        (p: any) => p._id?.toString() !== userId
      );
      const otherUserId = otherParticipant?._id?.toString();
      const otherUnread = otherUserId
        ? (c.unreadCounts?.get?.(otherUserId) ?? c.unreadCounts?.[otherUserId] ?? 0)
        : 0;

      return {
        ...c,
        unreadCount: myUnread,
        recipientRead: otherUnread === 0,
      };
    });

    return res.status(200).json({
      conversations: mapped,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Failed to fetch conversations", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/messages/conversations/:conversationId/messages  — Send a message
// Body: { text: string, media?: [] }
// ═════════════════════════════════════════════════════════════════════════════

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const { text, media, replyTo } = req.body;

    const hasText = text?.trim();
    const hasMedia = Array.isArray(media) && media.length > 0;

    if (!hasText && !hasMedia) {
      return res.status(400).json({ message: "Message must contain text or media" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Verify user is a participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create the message
    const message = await MessageModel.create({
      conversationId: conversation._id,
      senderId: new mongoose.Types.ObjectId(userId),
      text: hasText ? text.trim() : "",
      media: media || [],
      replyTo: replyTo && mongoose.Types.ObjectId.isValid(replyTo)
        ? new mongoose.Types.ObjectId(replyTo)
        : undefined,
      readBy: [new mongoose.Types.ObjectId(userId)],
    });

    // Build last-message preview text
    let previewText = hasText ? text.trim().substring(0, 100) : "";
    if (!hasText && hasMedia) {
      const firstMedia = media[0];
      if (firstMedia.type === "audio") previewText = "\uD83C\uDFA4 Voice message";
      else if (firstMedia.type === "image") previewText = "\uD83D\uDCF7 Photo";
      else if (firstMedia.type === "video") previewText = "\uD83C\uDFA5 Video";
      else previewText = "\uD83D\uDCCE File";
    }

    // Update conversation's lastMessage + atomically increment unread for the OTHER participant
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== userId
    );

    const unreadKey = `unreadCounts.${otherParticipantId!.toString()}`;

    await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: {
          text: previewText,
          senderId: new mongoose.Types.ObjectId(userId),
          createdAt: message.createdAt,
        },
        updatedAt: new Date(),
      },
      $inc: { [unreadKey]: 1 },
    });

    // Send notification to the other participant
    const sender = await User.findById(userId).select("name surname avatar").lean();
    if (sender && otherParticipantId) {
      const senderName = `${sender.name} ${sender.surname || ""}`.trim();
      emitUserNotification({
        recipientId: otherParticipantId.toString(),
        actorId: userId,
        actorName: senderName,
        actorAvatar: sender.avatar?.url,
        type: "message",
        message: `${senderName}: ${previewText.substring(0, 60)}`,
        resourceType: "user",
        resourceId: conversationId,
      });
    }

    // Populate sender info and replyTo on the message for return
    const populated = await MessageModel.findById(message._id)
      .populate("senderId", "_id name surname avatar")
      .populate({
        path: "replyTo",
        select: "_id text senderId media",
        populate: { path: "senderId", select: "_id name surname" },
      })
      .lean();

    return res.status(201).json({ message: populated });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/messages/conversations/:conversationId/messages?page=1&limit=30
// ═════════════════════════════════════════════════════════════════════════════

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Verify participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const filter = { conversationId: new mongoose.Types.ObjectId(conversationId) };

    const [messages, total] = await Promise.all([
      MessageModel.find(filter)
        .populate("senderId", "_id name surname avatar")
        .populate({
          path: "replyTo",
          select: "_id text senderId media",
          populate: { path: "senderId", select: "_id name surname" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      messages,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: skip + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/messages/conversations/:conversationId/read  — Mark messages read
// ═════════════════════════════════════════════════════════════════════════════

export const markMessagesRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Verify participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Add userId to readBy for all unread messages in this conversation
    await MessageModel.updateMany(
      {
        conversationId: conversation._id,
        readBy: { $ne: userObjId },
      },
      { $addToSet: { readBy: userObjId } }
    );

    // Reset unread count for this user
    conversation.unreadCounts.set(userId, 0);
    await conversation.save();

    return res.status(200).json({ message: "Messages marked as read" });
  } catch (error: any) {
    console.error("Error marking messages read:", error);
    return res.status(500).json({ message: "Failed to mark messages read", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/messages/unread-count  — Total unread message count (badge)
// ═════════════════════════════════════════════════════════════════════════════

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const conversations = await ConversationModel.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .select("unreadCounts")
      .lean();

    let totalUnread = 0;
    for (const c of conversations) {
      const counts = c.unreadCounts as any;
      const userCount = counts?.get?.(userId) ?? counts?.[userId] ?? 0;
      totalUnread += userCount;
    }

    return res.status(200).json({ unreadCount: totalUnread });
  } catch (error: any) {
    console.error("Error getting unread count:", error);
    return res.status(500).json({ message: "Failed to get unread count", error: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/messages/conversations/:conversationId  — Delete a conversation
// ═════════════════════════════════════════════════════════════════════════════

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Verify participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Delete all messages in the conversation
    await MessageModel.deleteMany({ conversationId: conversation._id });

    // Delete the conversation
    await conversation.deleteOne();

    return res.status(200).json({ message: "Conversation deleted" });
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Failed to delete conversation", error: error.message });
  }
};
