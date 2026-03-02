/**
 * User Notification Helper
 *
 * Fire-and-forget notification creation for user-facing notifications.
 * Parallel to the existing church-admin `emitSocialNotification`.
 */

import { UserNotificationModel, UserNotificationType } from "../models/UserNotification";
import mongoose from "mongoose";

interface UserNotifyParams {
  recipientId: string;       // User who receives the notification
  actorId: string;           // User who triggered the action
  actorName: string;
  actorAvatar?: string;
  type: UserNotificationType;
  message: string;
  resourceType?: 'post' | 'comment' | 'user' | 'church';
  resourceId?: string;
  meta?: {
    postSnippet?: string;
    commentSnippet?: string;
    reactionType?: string;
    churchName?: string;
    churchId?: string;
  };
  groupKey?: string;          // e.g. "like_<postId>" for batching
}

/**
 * Emit a user notification — fire and forget.
 * Never throws; safe to call from any handler without try/catch.
 * Skips notification if actor === recipient (don't notify yourself).
 */
export const emitUserNotification = (params: UserNotifyParams) => {
  // Don't notify yourself
  if (params.recipientId === params.actorId) return;

  UserNotificationModel.create({
    recipientId: new mongoose.Types.ObjectId(params.recipientId),
    actorId: new mongoose.Types.ObjectId(params.actorId),
    actorName: params.actorName,
    actorAvatar: params.actorAvatar || '',
    type: params.type,
    message: params.message,
    resourceType: params.resourceType,
    resourceId: params.resourceId ? new mongoose.Types.ObjectId(params.resourceId) : undefined,
    meta: params.meta,
    groupKey: params.groupKey,
  }).catch(err => {
    console.error('[UserNotification] Failed to emit:', err.message);
  });
};

/**
 * Batch emit notifications to multiple recipients.
 * Useful for "new post from someone you follow" notifications.
 */
export const emitUserNotificationBatch = (recipientIds: string[], params: Omit<UserNotifyParams, 'recipientId'>) => {
  const docs = recipientIds
    .filter(id => id !== params.actorId) // Don't notify yourself
    .map(recipientId => ({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      actorId: new mongoose.Types.ObjectId(params.actorId),
      actorName: params.actorName,
      actorAvatar: params.actorAvatar || '',
      type: params.type,
      message: params.message,
      resourceType: params.resourceType,
      resourceId: params.resourceId ? new mongoose.Types.ObjectId(params.resourceId) : undefined,
      meta: params.meta,
      groupKey: params.groupKey,
    }));

  if (docs.length === 0) return;

  UserNotificationModel.insertMany(docs, { ordered: false }).catch(err => {
    console.error('[UserNotification] Failed to batch emit:', err.message);
  });
};
