import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Annotation, { AnnotationType, HighlightColor, IAnnotation } from '../models/Annotation';
import authMiddleware from '../middlewares/authMiddleware';
import { generalRateLimiter } from '../middlewares/rateLimiter';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

/**
 * Validation middleware for annotation creation
 */
const validateCreateAnnotation = (req: AuthRequest, res: Response, next: Function) => {
  const { verseUsfm, type, color, noteText, noteTitle } = req.body;

  // Validate verseUsfm
  if (!verseUsfm || typeof verseUsfm !== 'string') {
    return res.status(400).json({ message: 'verseUsfm is required and must be a string' });
  }

  // Validate USFM format (e.g., "GEN.1.1")
  const usfmRegex = /^[A-Z0-9]+\.\d+\.\d+$/i;
  if (!usfmRegex.test(verseUsfm)) {
    return res.status(400).json({ 
      message: 'Invalid USFM format. Expected format: BOOK.CHAPTER.VERSE (e.g., GEN.1.1)' 
    });
  }

  // Validate type
  if (!type || !Object.values(AnnotationType).includes(type)) {
    return res.status(400).json({ 
      message: `Invalid annotation type. Must be one of: ${Object.values(AnnotationType).join(', ')}` 
    });
  }

  // Type-specific validation
  if (type === AnnotationType.HIGHLIGHT) {
    if (!color || typeof color !== 'string') {
      return res.status(400).json({ message: 'Highlight annotations require a color' });
    }
    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return res.status(400).json({ message: 'Color must be a valid hex color (e.g., #FFF59D)' });
    }
  }

  if (type === AnnotationType.NOTE) {
    if (!noteText || typeof noteText !== 'string' || noteText.trim().length === 0) {
      return res.status(400).json({ message: 'Note annotations require noteText' });
    }
    if (noteText.length > 5000) {
      return res.status(400).json({ message: 'Note text cannot exceed 5000 characters' });
    }
    if (noteTitle && noteTitle.length > 200) {
      return res.status(400).json({ message: 'Note title cannot exceed 200 characters' });
    }
  }

  next();
};

/**
 * Validation middleware for annotation update
 */
const validateUpdateAnnotation = (req: AuthRequest, res: Response, next: Function) => {
  const { color, noteText, noteTitle } = req.body;

  // At least one field must be provided
  if (!color && !noteText && noteTitle === undefined) {
    return res.status(400).json({ 
      message: 'At least one field must be provided for update (color, noteText, or noteTitle)' 
    });
  }

  // Validate color if provided
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ message: 'Color must be a valid hex color (e.g., #FFF59D)' });
  }

  // Validate noteText if provided
  if (noteText !== undefined) {
    if (typeof noteText !== 'string') {
      return res.status(400).json({ message: 'noteText must be a string' });
    }
    if (noteText.length > 5000) {
      return res.status(400).json({ message: 'Note text cannot exceed 5000 characters' });
    }
  }

  // Validate noteTitle if provided
  if (noteTitle !== undefined) {
    if (typeof noteTitle !== 'string') {
      return res.status(400).json({ message: 'noteTitle must be a string' });
    }
    if (noteTitle.length > 200) {
      return res.status(400).json({ message: 'Note title cannot exceed 200 characters' });
    }
  }

  next();
};

/**
 * GET /api/annotations
 * Get all annotations for the authenticated user
 * 
 * Query params:
 * - type: Filter by annotation type (highlight, note, bookmark)
 * - verseUsfm: Filter by specific verse
 * - book: Filter by book abbreviation (e.g., GEN)
 * - chapter: Filter by chapter number (requires book)
 */
router.get(
  '/',
  authMiddleware,
  generalRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { type, verseUsfm, book, chapter } = req.query;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let query: any = { userId: new mongoose.Types.ObjectId(userId) };

      // Filter by type
      if (type) {
        if (!Object.values(AnnotationType).includes(type as AnnotationType)) {
          return res.status(400).json({ 
            message: `Invalid type. Must be one of: ${Object.values(AnnotationType).join(', ')}` 
          });
        }
        query.type = type;
      }

      // Filter by specific verse
      if (verseUsfm) {
        query.verseUsfm = (verseUsfm as string).toUpperCase();
      }

      // Filter by chapter (e.g., book=GEN&chapter=1)
      if (book && chapter) {
        const chapterNum = parseInt(chapter as string, 10);
        if (isNaN(chapterNum)) {
          return res.status(400).json({ message: 'Chapter must be a valid number' });
        }
        const regex = new RegExp(`^${(book as string).toUpperCase()}\\.${chapterNum}\\.\\d+$`);
        query.verseUsfm = regex;
      } else if (book || chapter) {
        return res.status(400).json({ message: 'Both book and chapter are required for chapter filtering' });
      }

      const annotations = await Annotation.find(query)
        .sort({ createdAt: -1 })
        .lean();

      logger.info('Fetched annotations', { 
        userId, 
        count: annotations.length, 
        filters: { type, verseUsfm, book, chapter } 
      });

      res.json({
        success: true,
        count: annotations.length,
        annotations,
      });
    } catch (error: any) {
      logger.error('Error fetching annotations', { error: error.message, userId: req.userId });
      res.status(500).json({ message: 'Failed to fetch annotations', error: error.message });
    }
  }
);

/**
 * POST /api/annotations
 * Create a new annotation
 * 
 * Body:
 * - verseUsfm: string (required) - e.g., "GEN.1.1"
 * - type: string (required) - "highlight", "note", or "bookmark"
 * - color: string (required for highlights) - hex color
 * - noteText: string (required for notes) - note content
 * - noteTitle: string (optional for notes) - note title
 */
router.post(
  '/',
  authMiddleware,
  generalRateLimiter,
  validateCreateAnnotation,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { 
        verseUsfm, 
        type, 
        color, 
        noteText, 
        noteTitle,
        // Bible version tracking fields
        versionId,
        versionAbbreviation,
        languageCode,
      } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check for duplicate bookmark
      if (type === AnnotationType.BOOKMARK) {
        const existingBookmark = await Annotation.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          verseUsfm: verseUsfm.toUpperCase(),
          type: AnnotationType.BOOKMARK,
        });

        if (existingBookmark) {
          return res.status(409).json({ 
            message: 'Bookmark already exists for this verse',
            annotation: existingBookmark,
          });
        }
      }

      // Create annotation
      const annotation = new Annotation({
        userId: new mongoose.Types.ObjectId(userId),
        verseUsfm: verseUsfm.toUpperCase(),
        type,
        color: type === AnnotationType.HIGHLIGHT ? color : undefined,
        noteText: type === AnnotationType.NOTE ? noteText : undefined,
        noteTitle: type === AnnotationType.NOTE ? noteTitle : undefined,
        // Version tracking
        versionId,
        versionAbbreviation,
        languageCode,
      });

      await annotation.save();

      logger.info('Created annotation', { 
        userId, 
        annotationId: annotation._id, 
        type,
        verseUsfm: annotation.verseUsfm,
        versionId,
        versionAbbreviation,
      });

      res.status(201).json({
        success: true,
        message: 'Annotation created successfully',
        annotation,
      });
    } catch (error: any) {
      logger.error('Error creating annotation', { error: error.message, userId: req.userId });
      
      // Handle duplicate key error (unique index violation)
      if (error.code === 11000) {
        return res.status(409).json({ 
          message: 'An annotation of this type already exists for this verse',
        });
      }

      res.status(500).json({ message: 'Failed to create annotation', error: error.message });
    }
  }
);

/**
 * PATCH /api/annotations/:id
 * Update an existing annotation
 * 
 * Body:
 * - color: string (optional) - new hex color for highlights
 * - noteText: string (optional) - new note content
 * - noteTitle: string (optional) - new note title
 */
router.patch(
  '/:id',
  authMiddleware,
  generalRateLimiter,
  validateUpdateAnnotation,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { color, noteText, noteTitle } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate annotation ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid annotation ID' });
      }

      // Find annotation
      const annotation = await Annotation.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!annotation) {
        return res.status(404).json({ message: 'Annotation not found' });
      }

      // Prevent updating bookmarks (they don't have editable fields)
      if (annotation.type === AnnotationType.BOOKMARK) {
        return res.status(400).json({ message: 'Bookmarks cannot be updated. Delete and recreate if needed.' });
      }

      // Update fields based on annotation type
      if (annotation.type === AnnotationType.HIGHLIGHT && color) {
        annotation.color = color;
      }

      if (annotation.type === AnnotationType.NOTE) {
        if (noteText !== undefined) {
          if (noteText.trim().length === 0) {
            return res.status(400).json({ message: 'Note text cannot be empty' });
          }
          annotation.noteText = noteText;
        }
        if (noteTitle !== undefined) {
          annotation.noteTitle = noteTitle;
        }
      }

      await annotation.save();

      logger.info('Updated annotation', { 
        userId, 
        annotationId: annotation._id, 
        type: annotation.type,
      });

      res.json({
        success: true,
        message: 'Annotation updated successfully',
        annotation,
      });
    } catch (error: any) {
      logger.error('Error updating annotation', { error: error.message, userId: req.userId });
      res.status(500).json({ message: 'Failed to update annotation', error: error.message });
    }
  }
);

/**
 * DELETE /api/annotations/:id
 * Delete an annotation
 */
router.delete(
  '/:id',
  authMiddleware,
  generalRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate annotation ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid annotation ID' });
      }

      // Delete annotation (ensure it belongs to the user)
      const result = await Annotation.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Annotation not found' });
      }

      logger.info('Deleted annotation', { userId, annotationId: id });

      res.json({
        success: true,
        message: 'Annotation deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting annotation', { error: error.message, userId: req.userId });
      res.status(500).json({ message: 'Failed to delete annotation', error: error.message });
    }
  }
);

/**
 * DELETE /api/annotations/verse/:verseUsfm
 * Delete all annotations for a specific verse
 */
router.delete(
  '/verse/:verseUsfm',
  authMiddleware,
  generalRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { verseUsfm } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate USFM format
      const usfmRegex = /^[A-Z0-9]+\.\d+\.\d+$/i;
      if (!usfmRegex.test(verseUsfm)) {
        return res.status(400).json({ 
          message: 'Invalid USFM format. Expected format: BOOK.CHAPTER.VERSE (e.g., GEN.1.1)' 
        });
      }

      // Delete all annotations for this verse
      const result = await Annotation.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
        verseUsfm: verseUsfm.toUpperCase(),
      });

      logger.info('Deleted verse annotations', { 
        userId, 
        verseUsfm: verseUsfm.toUpperCase(), 
        deletedCount: result.deletedCount 
      });

      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} annotation(s)`,
        deletedCount: result.deletedCount,
      });
    } catch (error: any) {
      logger.error('Error deleting verse annotations', { error: error.message, userId: req.userId });
      res.status(500).json({ message: 'Failed to delete annotations', error: error.message });
    }
  }
);

/**
 * GET /api/annotations/stats
 * Get annotation statistics for the authenticated user
 */
router.get(
  '/stats',
  authMiddleware,
  generalRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userIdObj = new mongoose.Types.ObjectId(userId);

      // Get counts by type
      const [totalCount, highlightCount, noteCount, bookmarkCount] = await Promise.all([
        Annotation.countDocuments({ userId: userIdObj }),
        Annotation.countDocuments({ userId: userIdObj, type: AnnotationType.HIGHLIGHT }),
        Annotation.countDocuments({ userId: userIdObj, type: AnnotationType.NOTE }),
        Annotation.countDocuments({ userId: userIdObj, type: AnnotationType.BOOKMARK }),
      ]);

      // Get most recent annotation
      const recentAnnotation = await Annotation.findOne({ userId: userIdObj })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        stats: {
          total: totalCount,
          highlights: highlightCount,
          notes: noteCount,
          bookmarks: bookmarkCount,
          lastAnnotated: recentAnnotation?.createdAt || null,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching annotation stats', { error: error.message, userId: req.userId });
      res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
  }
);

export default router;
