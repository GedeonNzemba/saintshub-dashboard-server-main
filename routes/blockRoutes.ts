import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { checkChurchOwnership } from "../middlewares/churchOwnershipMiddleware";
import { cacheMiddleware, invalidateCacheOnUpdate } from "../middlewares/cacheMiddleware";
import { generalRateLimiter } from "../middlewares/rateLimiter";
import {
  getBlocks,
  saveBlocks,
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  getTheme,
  saveTheme,
  migrateToBlocks,
} from "../controllers/blockController";

const router = express.Router();

// ─── Public read routes (cached) ────────────────────────────────────────────
router.get(
  "/churches/:churchId/blocks",
  cacheMiddleware(300),
  getBlocks
);

router.get(
  "/churches/:churchId/theme",
  cacheMiddleware(300),
  getTheme
);

// ─── Protected write routes (require auth + ownership + rate limit) ─────────
router.put(
  "/churches/:churchId/blocks",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  saveBlocks
);

router.post(
  "/churches/:churchId/blocks",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  addBlock
);

router.patch(
  "/churches/:churchId/blocks/reorder",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  reorderBlocks
);

router.patch(
  "/churches/:churchId/blocks/:blockId",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  updateBlock
);

router.delete(
  "/churches/:churchId/blocks/:blockId",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  deleteBlock
);

router.put(
  "/churches/:churchId/theme",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  saveTheme
);

// ─── Migration (one-time, requires auth + ownership) ────────────────────────
router.post(
  "/churches/:churchId/blocks/migrate",
  authMiddleware,
  generalRateLimiter,
  checkChurchOwnership,
  invalidateCacheOnUpdate("/churches"),
  migrateToBlocks
);

export default router;
