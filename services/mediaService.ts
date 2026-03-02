/**
 * Media Service — Cloudflare R2 Object Storage
 *
 * Central media upload/delete/stats service used across the entire app:
 *   - User avatars & cover photos
 *   - Church images, banners, gallery
 *   - Songs, sermons (audio & video)
 *   - Documents & PDFs
 *   - Posts & status updates (future)
 *
 * R2 is S3-compatible — we use the aws-sdk S3 client pointed at Cloudflare.
 * Files are served via CDN at MEDIA_CDN_DOMAIN (e.g. saintshub.online).
 *
 * Bucket layout:
 *   users/<userId>/avatars/…
 *   users/<userId>/covers/…
 *   churches/<churchId>/images/…
 *   churches/<churchId>/banners/…
 *   churches/<churchId>/gallery/…
 *   churches/<churchId>/songs/…
 *   churches/<churchId>/sermons/…
 *   churches/<churchId>/documents/…
 *   posts/<postId>/…           (future)
 *   status/<userId>/…          (future)
 *   general/…                  (catch-all)
 */

import { S3 } from '@aws-sdk/client-s3';
import path from 'path';
import logger from '../utils/logger';

// ─── R2 Client ───────────────────────────────────────────────────────────────
const ACCOUNT_ID  = process.env.CF_ACCOUNT_ID || '';
const ACCESS_KEY  = process.env.CF_R2_ACCESS_KEY_ID || '';
const SECRET_KEY  = process.env.CF_R2_SECRET_ACCESS_KEY || '';
const BUCKET      = process.env.CF_R2_BUCKET || 'sermon-audios';
const CDN_DOMAIN  = process.env.MEDIA_CDN_DOMAIN || 'saintshub.online';

// Log R2 configuration on startup (mask secrets)
logger.info('R2 Media Service initializing', {
  accountId: ACCOUNT_ID ? `${ACCOUNT_ID.slice(0, 8)}...` : 'MISSING',
  accessKey: ACCESS_KEY ? `${ACCESS_KEY.slice(0, 8)}...` : 'MISSING',
  secretKey: SECRET_KEY ? '***configured***' : 'MISSING',
  bucket: BUCKET,
  cdnDomain: CDN_DOMAIN,
  endpoint: ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : 'MISSING',
});

const s3 = new S3({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// ─── R2 Connection Test ──────────────────────────────────────────────────────
export async function testR2Connection(): Promise<{
  connected: boolean;
  bucket: string;
  objectCount?: number;
  error?: string;
}> {
  try {
    const res = await s3.listObjectsV2({
      Bucket: BUCKET,
      MaxKeys: 1,
    });

    return {
      connected: true,
      bucket: BUCKET,
      objectCount: res.KeyCount || 0,
    };
  } catch (err: any) {
    logger.error('R2 connection test failed', {
      error: err.message,
      code: err.Code || err.code,
      bucket: BUCKET,
    });

    return {
      connected: false,
      bucket: BUCKET,
      error: err.message,
    };
  }
}

// ─── Upload Categories ───────────────────────────────────────────────────────
// Extensible — add categories here as new features launch (posts, status, etc.)
export type MediaCategory =
  // User related
  | 'users/avatars'
  | 'users/covers'
  // Church related
  | 'churches/images'
  | 'churches/banners'
  | 'churches/gallery'
  | 'churches/songs'
  | 'churches/sermons'
  | 'churches/documents'
  // Future — posts & status
  | 'posts/media'
  | 'status/media'
  // Catch-all
  | 'general';

// ─── Storage Plans (bytes) ───────────────────────────────────────────────────
const STORAGE_LIMITS: Record<string, number> = {
  free:       500 * 1024 * 1024,         //   500 MB
  basic:    5 * 1024 * 1024 * 1024,      //     5 GB
  pro:     50 * 1024 * 1024 * 1024,      //    50 GB
  unlimited: Infinity,
};

// ─── Per-File Size Limits ────────────────────────────────────────────────────
const MAX_FILE_SIZES: Record<string, number> = {
  image:     10 * 1024 * 1024,     //  10 MB
  audio:     50 * 1024 * 1024,     //  50 MB
  video:    500 * 1024 * 1024,     // 500 MB
  document:  20 * 1024 * 1024,     //  20 MB
};

// ─── Allowed MIME Types ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'image/heic', 'image/heif',
  ],
  audio: [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac',
    'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/x-m4a',
  ],
  video: [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Detect broad media type from MIME string */
export function getMediaType(mimeType: string): 'image' | 'audio' | 'video' | 'document' | null {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mimeType)) return type as 'image' | 'audio' | 'video' | 'document';
  }
  return null;
}

/** Root prefix — keeps all app uploads isolated from sermon directories */
const UPLOAD_ROOT = 'uploads';

/** Build a unique object key inside the bucket */
function buildKey(scope: string, category: MediaCategory, fileName: string, mimeType: string): string {
  const ext = path.extname(fileName) || `.${mimeType.split('/')[1] || 'bin'}`;
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  // e.g. uploads/churches/songs/<churchId>/<uid>.mp3
  return `${UPLOAD_ROOT}/${category}/${scope}/${uid}${ext}`;
}

// ─── Get storage used by a scope (user or church) ───────────────────────────
export async function getStorageUsage(scopeId: string): Promise<number> {
  let totalSize = 0;
  let token: string | undefined;

  // Search across all category prefixes that might reference this scope ID
  const prefixes = [
    `${UPLOAD_ROOT}/users/avatars/${scopeId}/`,
    `${UPLOAD_ROOT}/users/covers/${scopeId}/`,
    `${UPLOAD_ROOT}/churches/images/${scopeId}/`,
    `${UPLOAD_ROOT}/churches/banners/${scopeId}/`,
    `${UPLOAD_ROOT}/churches/gallery/${scopeId}/`,
    `${UPLOAD_ROOT}/churches/songs/${scopeId}/`,
    `${UPLOAD_ROOT}/churches/sermons/${scopeId}/`,
    `${UPLOAD_ROOT}/churches/documents/${scopeId}/`,
    `${UPLOAD_ROOT}/posts/media/${scopeId}/`,
    `${UPLOAD_ROOT}/status/media/${scopeId}/`,
    `${UPLOAD_ROOT}/general/${scopeId}/`,
  ];

  for (const prefix of prefixes) {
    do {
      const res = await s3.listObjectsV2({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      });

      if (res.Contents) {
        totalSize += res.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
      }
      token = res.NextContinuationToken;
    } while (token);
  }

  return totalSize;
}

// ─── Upload ──────────────────────────────────────────────────────────────────
export interface UploadParams {
  /** Owner ID — userId or churchId — namespaces files */
  scope: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
  category: MediaCategory;
  /** Owner plan — controls storage quota */
  plan?: string;
  /** Skip quota check (e.g. admin uploads) */
  skipQuota?: boolean;
}

export interface UploadResult {
  /** Public CDN url ready for database storage */
  url: string;
  /** R2 object key — save this for future delete */
  key: string;
  /** File size in bytes */
  size: number;
  /** Broad media type */
  mediaType: 'image' | 'audio' | 'video' | 'document';
}

export async function uploadMedia(params: UploadParams): Promise<UploadResult> {
  const { scope, file, fileName, mimeType, category, plan = 'free', skipQuota = false } = params;

  const startTime = Date.now();
  logger.info('Media upload started', { scope, category, fileName, mimeType, fileSize: file.length, plan });

  // 1. Validate MIME type
  const mediaType = getMediaType(mimeType);
  if (!mediaType) {
    logger.warn('Upload rejected — unsupported MIME type', { scope, mimeType, fileName });
    throw Object.assign(new Error(`Unsupported file type: ${mimeType}`), { statusCode: 415 });
  }

  // 2. Validate file size
  const maxSize = MAX_FILE_SIZES[mediaType];
  if (file.length > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    logger.warn('Upload rejected — file too large', { scope, fileName, fileSizeMB: Math.round(file.length / (1024 * 1024)), maxMB, mediaType });
    throw Object.assign(
      new Error(`File too large. Maximum ${mediaType} size is ${maxMB}MB.`),
      { statusCode: 413 },
    );
  }

  // 3. Check storage quota
  if (!skipQuota) {
    const used = await getStorageUsage(scope);
    const limit = STORAGE_LIMITS[plan] || STORAGE_LIMITS.free;

    logger.debug('Quota check', { scope, usedMB: Math.round(used / (1024 * 1024)), limitMB: limit === Infinity ? 'Unlimited' : Math.round(limit / (1024 * 1024)) });

    if (limit !== Infinity && used + file.length > limit) {
      const usedMB = Math.round(used / (1024 * 1024));
      const limitMB = Math.round(limit / (1024 * 1024));
      logger.warn('Upload rejected — storage limit', { scope, usedMB, limitMB, plan });
      throw Object.assign(
        new Error(`Storage limit reached (${usedMB}MB used of ${limitMB}MB). Please upgrade your plan.`),
        { statusCode: 413 },
      );
    }
  }

  // 4. Upload to R2
  const key = buildKey(scope, category, fileName, mimeType);

  logger.debug('Uploading to R2', { bucket: BUCKET, key, contentType: mimeType });

  await s3.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000', // 1 year immutable cache
    Metadata: {
      'scope':         scope,
      'category':      category,
      'original-name': encodeURIComponent(fileName),
      'uploaded-at':   new Date().toISOString(),
    },
  });

  const url = `https://${CDN_DOMAIN}/${key}`;
  const durationMs = Date.now() - startTime;

  logger.info('Media uploaded to R2', {
    scope, category, key, size: file.length, mediaType,
    url, durationMs,
  });

  return { url, key, size: file.length, mediaType };
}

// ─── Delete ──────────────────────────────────────────────────────────────────
/** Safe-delete: only allows deletion of known app prefixes, never sermon root dirs */
export async function deleteMedia(key: string): Promise<void> {
  const safeRoots = ['uploads/users/', 'uploads/churches/', 'uploads/posts/', 'uploads/status/', 'uploads/general/'];
  if (!safeRoots.some(p => key.startsWith(p))) {
    throw Object.assign(
      new Error('Cannot delete this file — outside managed scope.'),
      { statusCode: 403 },
    );
  }

  await s3.deleteObject({ Bucket: BUCKET, Key: key });
  logger.info('Media deleted from R2', { key });
}

// ─── Replace (atomic upload-new → delete-old) ───────────────────────────────
export async function replaceMedia(
  oldKey: string | null | undefined,
  params: UploadParams,
): Promise<UploadResult> {
  // Upload new first so we never lose data
  const result = await uploadMedia(params);

  // Then try to remove the old one (best-effort)
  if (oldKey) {
    try {
      await deleteMedia(oldKey);
    } catch (err: any) {
      logger.warn('Failed to delete old media during replace', { oldKey, err: err.message });
    }
  }

  return result;
}

// ─── Storage Stats ───────────────────────────────────────────────────────────
export async function getStorageStats(scopeId: string, plan: string = 'free') {
  const used  = await getStorageUsage(scopeId);
  const limit = STORAGE_LIMITS[plan] || STORAGE_LIMITS.free;

  return {
    usedBytes:    used,
    usedMB:       Math.round(used / (1024 * 1024)),
    limitMB:      limit === Infinity ? 'Unlimited' : Math.round(limit / (1024 * 1024)),
    percentUsed:  limit === Infinity ? 0 : Math.round((used / limit) * 100),
    remainingMB:  limit === Infinity ? 'Unlimited' : Math.round((limit - used) / (1024 * 1024)),
  };
}
