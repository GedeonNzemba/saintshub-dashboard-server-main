/**
 * Social Notification Helper
 *
 * Fire-and-forget notification creation used by the social controller.
 * All calls are non-blocking — errors are logged but never thrown.
 */

import { SocialNotificationModel, SocialNotificationType } from "../models/SocialNotification";
import mongoose from "mongoose";

interface NotifyParams {
  churchId: string;
  type: SocialNotificationType;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetId?: string;
  targetType?: 'post' | 'comment' | 'status';
  message: string;
  meta?: {
    reactionType?: string;
    postSnippet?: string;
    commentSnippet?: string;
  };
}

/**
 * Create a notification — fire and forget.
 * Never throws; safe to call from any handler without try/catch.
 */
export const emitSocialNotification = (params: NotifyParams) => {
  SocialNotificationModel.create({
    churchId: new mongoose.Types.ObjectId(params.churchId),
    type: params.type,
    actorId: new mongoose.Types.ObjectId(params.actorId),
    actorName: params.actorName,
    actorAvatar: params.actorAvatar || '',
    targetId: params.targetId ? new mongoose.Types.ObjectId(params.targetId) : undefined,
    targetType: params.targetType,
    message: params.message,
    meta: params.meta,
  }).catch(err => {
    console.error('[SocialNotification] Failed to emit:', err.message);
  });
};
