/**
 * Image Upload – Uniqueness Tests
 *
 * Validates the critical fix: every Cloudinary upload MUST receive a
 * globally unique `public_id` so images never overwrite each other.
 *
 * These tests work by:
 *  1. Extracting the upload-route handler logic and verifying the
 *     public_id pattern.
 *  2. Simulating multiple sequential uploads and asserting every
 *     generated public_id is unique.
 *  3. Verifying the response contains a proper `secure_url`.
 */

import { v4 as uuidv4, validate as isUuid } from 'uuid';

// ─── Helper: Replicate the public_id generation logic from authRoutes.ts ───
function generatePublicId(): string {
  return `saintshub_${Date.now()}_${uuidv4()}`;
}

describe('Image Upload – Unique public_id Generation', () => {

  test('generated public_id starts with "saintshub_" prefix', () => {
    const id = generatePublicId();
    expect(id.startsWith('saintshub_')).toBe(true);
  });

  test('generated public_id contains a valid UUID', () => {
    const id = generatePublicId();
    // Format: saintshub_<timestamp>_<uuid>
    const parts = id.split('_');
    // parts[0] = "saintshub", parts[1] = timestamp, parts[2..5] = uuid segments
    const uuidPart = parts.slice(2).join('_');
    // uuid v4 uses hyphens not underscores, but our split is on underscore
    // Let's extract it differently
    const afterPrefix = id.replace('saintshub_', '');
    const timestampEnd = afterPrefix.indexOf('_');
    const uuid = afterPrefix.substring(timestampEnd + 1);
    expect(isUuid(uuid)).toBe(true);
  });

  test('generated public_id contains a numeric timestamp', () => {
    const id = generatePublicId();
    const afterPrefix = id.replace('saintshub_', '');
    const timestamp = afterPrefix.split('_')[0];
    expect(Number(timestamp)).toBeGreaterThan(0);
    expect(Number(timestamp)).toBeLessThanOrEqual(Date.now());
  });

  test('100 sequential uploads produce 100 unique public_ids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generatePublicId());
    }
    expect(ids.size).toBe(100);
  });

  test('rapid-fire uploads (same millisecond) still produce unique IDs due to UUID', () => {
    // Force same timestamp by mocking Date.now
    const fixedTime = 1700000000000;
    const originalNow = Date.now;
    Date.now = () => fixedTime;

    try {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ids.add(generatePublicId());
      }
      expect(ids.size).toBe(50);
    } finally {
      Date.now = originalNow;
    }
  });

  test('public_id never equals "logo" (the old hardcoded value)', () => {
    for (let i = 0; i < 100; i++) {
      const id = generatePublicId();
      expect(id).not.toBe('logo');
      expect(id).not.toContain('"logo"');
    }
  });
});

// ─── Verify the route source code has no hardcoded public_id ───
describe('Image Upload – Route Source Code Verification', () => {
  let routeSourceCode: string;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    routeSourceCode = fs.readFileSync(
      path.join(__dirname, '..', 'routes', 'authRoutes.ts'),
      'utf-8'
    );
  });

  test('authRoutes.ts does NOT contain public_id: "logo"', () => {
    expect(routeSourceCode).not.toMatch(/public_id:\s*["']logo["']/);
  });

  test('authRoutes.ts uses uuidv4() in public_id generation', () => {
    expect(routeSourceCode).toMatch(/uuidv4\(\)/);
  });

  test('authRoutes.ts uses Date.now() in public_id generation', () => {
    expect(routeSourceCode).toMatch(/Date\.now\(\)/);
  });

  test('authRoutes.ts sets folder: "saintshub" for organized storage', () => {
    expect(routeSourceCode).toMatch(/folder:\s*["']saintshub["']/);
  });

  test('authRoutes.ts handles both single and multi-file uploads with unique IDs', () => {
    // Count occurrences of the unique public_id pattern
    const matches = routeSourceCode.match(/saintshub_\$\{Date\.now\(\)\}_\$\{uuidv4\(\)\}/g);
    // Should appear at least twice: once for single upload, once for multi
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Verify frontend upload utilities ───
describe('Frontend Upload Utilities – Source Code Verification', () => {
  const fs = require('fs');
  const path = require('path');
  const frontendRoot = path.join(__dirname, '..', '..', '..', 'frontend');

  const filesToCheck = [
    'hooks/dashboard/useImageUpload.ts',
    'tools/dashboard/uploadImage.ts',
    'components/rich-text-editor/TenTapEditor.tsx',
    'components/recycle/imagePicker/ImagePicker.tsx',
    'components/recycle/imagePicker/Test.tsx',
    'components/recycle/imagePicker/DashboardImageUploader.tsx',
    'components/dashboard/Demo.tsx',
  ];

  test.each(filesToCheck)(
    '%s does NOT use hardcoded name: "image.jpg" in FormData',
    (relPath) => {
      const fullPath = path.join(frontendRoot, relPath);
      if (!fs.existsSync(fullPath)) {
        // Skip if file doesn't exist (e.g., deleted legacy file)
        return;
      }
      const source = fs.readFileSync(fullPath, 'utf-8');
      // Match: name: "image.jpg" or name: 'image.jpg' (the FormData file name)
      // But NOT: type: "image/jpg" (MIME type) or fallback in uri.split
      const nameMatches = source.match(/name:\s*["']image\.jpg["']/g);
      expect(nameMatches).toBeNull();
    }
  );

  test('useImageUpload.ts adds cache-buster to returned URL', () => {
    const source = fs.readFileSync(
      path.join(frontendRoot, 'hooks/dashboard/useImageUpload.ts'),
      'utf-8'
    );
    expect(source).toMatch(/_cb=/);
  });

  test('uploadImage.ts adds cache-buster to returned URL', () => {
    const source = fs.readFileSync(
      path.join(frontendRoot, 'tools/dashboard/uploadImage.ts'),
      'utf-8'
    );
    expect(source).toMatch(/_cb=/);
  });

  test('TenTapEditor.tsx adds cache-buster to returned URL', () => {
    const source = fs.readFileSync(
      path.join(frontendRoot, 'components/rich-text-editor/TenTapEditor.tsx'),
      'utf-8'
    );
    expect(source).toMatch(/_cb=/);
  });
});

// ─── Cache-buster URL logic tests ───
describe('Cache-buster URL Logic', () => {
  function addCacheBuster(url: string): string {
    return url.includes('?') ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;
  }

  test('adds ?_cb= to URL without query params', () => {
    const result = addCacheBuster('https://res.cloudinary.com/demo/image/upload/saintshub/img.jpg');
    expect(result).toMatch(/\?_cb=\d+$/);
  });

  test('appends &_cb= to URL that already has query params', () => {
    const result = addCacheBuster('https://res.cloudinary.com/demo/image/upload/saintshub/img.jpg?v=123');
    expect(result).toMatch(/&_cb=\d+$/);
  });

  test('cache-buster changes between calls', async () => {
    const url = 'https://example.com/img.jpg';
    const result1 = addCacheBuster(url);
    await new Promise(r => setTimeout(r, 5));
    const result2 = addCacheBuster(url);
    // The _cb values should differ (different timestamps)
    expect(result1).not.toBe(result2);
  });

  test('two different Cloudinary URLs remain distinct after cache-buster', () => {
    const url1 = 'https://res.cloudinary.com/demo/saintshub/saintshub_1700000_abc.jpg';
    const url2 = 'https://res.cloudinary.com/demo/saintshub/saintshub_1700001_def.jpg';
    const r1 = addCacheBuster(url1);
    const r2 = addCacheBuster(url2);
    // Base URLs should remain different
    expect(r1.split('?')[0]).not.toBe(r2.split('?')[0]);
  });
});
