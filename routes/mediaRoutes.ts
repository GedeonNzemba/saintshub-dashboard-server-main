/**
 * Media Routes — /api/media
 *
 * One unified upload endpoint for the entire app.
 * The frontend sends a multipart/form-data request with:
 *   - file:      the binary file
 *   - category:  MediaCategory (e.g. 'users/avatars', 'churches/songs')
 *   - scope:     owning userId or churchId (defaults to the authenticated user)
 *   - oldKey:    (optional) R2 key of a file to replace
 *
 * Responses always return:
 *   { url, key, size, mediaType }
 *
 * The url is ready to store in MongoDB and display in the frontend.
 */

import express, { Request, Response } from 'express';
import formidable from 'formidable';
import fs from 'fs';
import authMiddleware from '../middlewares/authMiddleware';
import { uploadRateLimiter } from '../middlewares/rateLimiter';
import {
  uploadMedia,
  deleteMedia,
  replaceMedia,
  getStorageStats,
  getMediaType,
  MediaCategory,
  testR2Connection,
} from '../services/mediaService';
import logger from '../utils/logger';
import User from '../models/User';
import { sendStorageUpgradeRequestEmail } from '../services/emailService';

// Extend Express Request with userId (set by authMiddleware)
interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

// ─── GET /api/media/health ──────────────────────────────────────────────────
// Public health check for R2 connectivity — no auth required
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    const result = await testR2Connection();
    const latencyMs = Date.now() - start;

    logger.info('R2 health check', { ...result, latencyMs });

    if (result.connected) {
      return res.json({
        status: 'ok',
        service: 'cloudflare-r2',
        bucket: result.bucket,
        objectCount: result.objectCount,
        latencyMs,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        status: 'error',
        service: 'cloudflare-r2',
        error: result.error,
        latencyMs,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    logger.error('R2 health check failed', { error: error.message });
    return res.status(503).json({
      status: 'error',
      service: 'cloudflare-r2',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── POST /api/media/upload ─────────────────────────────────────────────────
// Universal file upload — works for everything:
//   user avatars, church images, songs, sermons, gallery, documents, posts, etc.
//
// Quota rules:
//   - Non-admin users: NO storage quota (they only upload avatars / small items)
//   - Admin users: Quota based on their storagePlan field (free=500MB, basic=5GB, etc.)
router.post(
  '/upload',
  authMiddleware,
  uploadRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      // Fetch user to determine admin status and storage plan
      const user = await User.findById((req as any).userId).select('admin storagePlan').lean();
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const isAdmin = user.admin === true;
      const plan = user.storagePlan || 'free';

      const form = formidable({
        maxFileSize: 500 * 1024 * 1024, // 500 MB hard cap
        keepExtensions: true,
      });

      const [fields, files] = await form.parse(req as any);

      // Support both 'file' and legacy 'profileImage' field names
      const rawFile = files.file || files.profileImage;
      const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const category = (fields.category?.[0] || 'general') as MediaCategory;
      const scope    = fields.scope?.[0] || (req as any).userId!;
      const oldKey   = fields.oldKey?.[0] || null;
      const mimeType = file.mimetype || 'application/octet-stream';

      // Quick MIME validation before reading into memory
      if (!getMediaType(mimeType)) {
        // Cleanup temp file
        try { fs.unlinkSync(file.filepath); } catch (_) {}
        return res.status(415).json({ message: `Unsupported file type: ${mimeType}` });
      }

      const fileBuffer = fs.readFileSync(file.filepath);

      const result = oldKey
        ? await replaceMedia(oldKey, {
            scope,
            file: fileBuffer,
            fileName: file.originalFilename || 'upload',
            mimeType,
            category,
            plan,
            // Non-admin users skip quota entirely
            skipQuota: !isAdmin,
          })
        : await uploadMedia({
            scope,
            file: fileBuffer,
            fileName: file.originalFilename || 'upload',
            mimeType,
            category,
            plan,
            // Non-admin users skip quota entirely
            skipQuota: !isAdmin,
          });

      // Cleanup temp file
      try { fs.unlinkSync(file.filepath); } catch (_) {}

      logger.info('Media upload success', { scope, category, key: result.key, size: result.size, isAdmin, plan });

      return res.status(201).json({
        message: 'File uploaded successfully',
        url:       result.url,
        key:       result.key,
        size:      result.size,
        mediaType: result.mediaType,
      });
    } catch (error: any) {
      logger.error('Media upload failed', { error: error.message });

      const status = error.statusCode || (
        error.message?.includes('Storage limit') ? 413
        : error.message?.includes('too large') ? 413
        : error.message?.includes('Unsupported') ? 415
        : 500
      );

      return res.status(status).json({ message: error.message || 'Upload failed' });
    }
  },
);

// ─── POST /api/media/upload-multiple ─────────────────────────────────────────
// Upload multiple files at once (gallery, batch song upload, etc.)
router.post(
  '/upload-multiple',
  authMiddleware,
  uploadRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      // Fetch user to determine admin status and storage plan
      const user = await User.findById((req as any).userId).select('admin storagePlan').lean();
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const isAdmin = user.admin === true;
      const plan = user.storagePlan || 'free';

      const form = formidable({
        maxFileSize: 500 * 1024 * 1024,
        keepExtensions: true,
        multiples: true,
      });

      const [fields, files] = await form.parse(req as any);

      const rawFiles = files.files || files.file || files.profileImage;
      const fileList = Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : [];

      if (fileList.length === 0) {
        return res.status(400).json({ message: 'No files provided' });
      }

      const category = (fields.category?.[0] || 'general') as MediaCategory;
      const scope    = fields.scope?.[0] || (req as any).userId!;

      const results = [];
      const errors: string[] = [];

      for (const f of fileList) {
        try {
          const mimeType = f.mimetype || 'application/octet-stream';
          const buffer   = fs.readFileSync(f.filepath);

          const result = await uploadMedia({
            scope,
            file: buffer,
            fileName: f.originalFilename || 'upload',
            mimeType,
            category,
            plan,
            skipQuota: !isAdmin,
          });

          results.push({
            url:       result.url,
            key:       result.key,
            size:      result.size,
            mediaType: result.mediaType,
            originalName: f.originalFilename,
          });
        } catch (err: any) {
          errors.push(`${f.originalFilename}: ${err.message}`);
        } finally {
          try { fs.unlinkSync(f.filepath); } catch (_) {}
        }
      }

      return res.status(201).json({
        message: `${results.length} file(s) uploaded${errors.length ? `, ${errors.length} failed` : ''}`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      logger.error('Multi-upload failed', { error: error.message });
      return res.status(500).json({ message: error.message || 'Upload failed' });
    }
  },
);

// ─── DELETE /api/media/delete ────────────────────────────────────────────────
// Delete a file by its R2 key
router.delete(
  '/delete',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const reqAny = req as any;
      const { key } = reqAny.body;
      if (!key) {
        return res.status(400).json({ message: 'key is required' });
      }

      // Basic ownership: key must reference the requesting user/church
      const userId = reqAny.userId!;
      const ownsFile = key.includes(`/${userId}/`);
      // Allow admin override (check req for isAdmin flag from adminMiddleware)
      const isAdmin = reqAny.isAdmin === true;

      if (!ownsFile && !isAdmin) {
        return res.status(403).json({ message: 'You do not have permission to delete this file' });
      }

      await deleteMedia(key);

      return res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      logger.error('Media delete failed', { error: error.message });
      return res.status(error.statusCode || 500).json({ message: error.message || 'Delete failed' });
    }
  },
);

// ─── POST /api/media/request-upgrade ────────────────────────────────────────
// Admin user requests a plan upgrade — sends email to SaintsHub super-admin
router.post(
  '/request-upgrade',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId!;
      const { requestedPlan, reason } = req.body;

      const VALID_PLANS = ['basic', 'pro', 'unlimited'] as const;
      if (!requestedPlan || !VALID_PLANS.includes(requestedPlan)) {
        return res.status(400).json({
          message: 'Invalid plan. Must be one of: basic, pro, unlimited',
        });
      }

      const user = await User.findById(userId)
        .select('name surname email admin storagePlan pendingUpgradeRequest')
        .lean();

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.admin) {
        return res.status(403).json({ message: 'Only admin users can request plan upgrades' });
      }

      // Block duplicate requests — one pending request at a time
      if (user.pendingUpgradeRequest) {
        return res.status(409).json({
          message: `You already have a pending upgrade request for the ${user.pendingUpgradeRequest.requestedPlan} plan. Please wait for the SaintsHub team to review it.`,
          pendingRequest: user.pendingUpgradeRequest,
        });
      }

      const currentPlan = user.storagePlan || 'free';

      if (currentPlan === requestedPlan) {
        return res.status(400).json({ message: `You are already on the ${requestedPlan} plan` });
      }

      // Check plan order — only allow requesting a higher plan
      const planOrder = ['free', 'basic', 'pro', 'unlimited'];
      if (planOrder.indexOf(requestedPlan) <= planOrder.indexOf(currentPlan)) {
        return res.status(400).json({
          message: `Cannot request a downgrade. Your current plan (${currentPlan}) is already at or above ${requestedPlan}.`,
        });
      }

      const userName = `${user.name || ''} ${user.surname || ''}`.trim();

      await sendStorageUpgradeRequestEmail(
        userName,
        user.email,
        currentPlan,
        requestedPlan,
        reason || ''
      );

      // Save the pending request on the user document
      await User.findByIdAndUpdate(userId, {
        pendingUpgradeRequest: {
          requestedPlan,
          reason: reason || '',
          requestedAt: new Date(),
        },
      });

      logger.info('Storage upgrade requested', {
        userId,
        currentPlan,
        requestedPlan,
        reason: reason || '(none)',
      });

      return res.json({
        message: 'Upgrade request submitted successfully. The SaintsHub team will review your request.',
        currentPlan,
        requestedPlan,
      });
    } catch (error: any) {
      logger.error('Upgrade request failed', { error: error.message });
      return res.status(500).json({ message: 'Failed to submit upgrade request' });
    }
  }
);

// ─── GET /api/media/storage ─────────────────────────────────────────────────
// Get storage usage stats for the authenticated user
router.get(
  '/storage',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const reqAny = req as any;
      const userId = reqAny.userId!;

      // Fetch user to get their plan from DB
      const user = await User.findById(userId).select('admin storagePlan pendingUpgradeRequest upgradeRequestResult').lean();
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const scope = (reqAny.query.scope as string) || userId;
      const plan  = user.storagePlan || 'free';

      // Non-admin users have no quota — show unlimited
      const effectivePlan = user.admin ? plan : 'unlimited';

      const stats = await getStorageStats(scope, effectivePlan);

      return res.json({
        ...stats,
        plan: effectivePlan,
        isAdmin: user.admin,
        pendingUpgradeRequest: user.pendingUpgradeRequest || null,
        upgradeRequestResult: user.upgradeRequestResult || null,
      });
    } catch (error: any) {
      logger.error('Storage stats failed', { error: error.message });
      return res.status(500).json({ message: error.message });
    }
  },
);

// ─── POST /api/media/acknowledge-upgrade-result ─────────────────────────────
// Clear the upgrade result after the user has seen the in-app notification
router.post(
  '/acknowledge-upgrade-result',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const reqAny = req as any;
      const userId = reqAny.userId!;

      await User.updateOne({ _id: userId }, { $unset: { upgradeRequestResult: 1 } });

      return res.json({ message: 'Upgrade result acknowledged' });
    } catch (error: any) {
      logger.error('Acknowledge upgrade result failed', { error: error.message });
      return res.status(500).json({ message: error.message });
    }
  },
);

export default router;
