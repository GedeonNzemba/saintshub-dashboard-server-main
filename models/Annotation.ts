import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Annotation types
 */
export enum AnnotationType {
  HIGHLIGHT = 'highlight',
  NOTE = 'note',
  BOOKMARK = 'bookmark',
}

/**
 * Predefined highlight colors
 */
export enum HighlightColor {
  YELLOW = '#FFF59D',
  GREEN = '#A5D6A7',
  BLUE = '#90CAF9',
  ORANGE = '#FFCC80',
  PINK = '#F48FB1',
  PURPLE = '#CE93D8',
}

/**
 * Annotation interface
 */
export interface IAnnotation extends Document {
  userId: mongoose.Types.ObjectId;
  verseUsfm: string; // Universal Standard Format Marker (e.g., "GEN.1.1")
  type: AnnotationType;
  color?: string; // For highlights (hex color)
  noteText?: string; // For notes
  noteTitle?: string; // Optional title for notes
  // Text range selection (for partial verse highlights/notes)
  startOffset?: number; // Character offset where selection starts (0-based)
  endOffset?: number; // Character offset where selection ends (0-based)
  selectedText?: string; // The actual text that was selected (for display)
  // Bible version tracking (for version-aware navigation)
  versionId?: number; // Bible version ID (e.g., 1 for KJV, 133 for LSG)
  versionAbbreviation?: string; // Version abbreviation (e.g., "KJV", "LSG")
  languageCode?: string; // Language code (e.g., "eng", "fra")
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Annotation schema
 */
const AnnotationSchema = new Schema<IAnnotation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    verseUsfm: {
      type: String,
      required: [true, 'Verse USFM is required'],
      uppercase: true,
      validate: {
        validator: function(v: string) {
          // Validate USFM format: BOOK.CHAPTER.VERSE (e.g., GEN.1.1)
          return /^[A-Z0-9]+\.\d+\.\d+$/i.test(v);
        },
        message: 'Invalid USFM format. Expected format: BOOK.CHAPTER.VERSE (e.g., GEN.1.1)',
      },
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Annotation type is required'],
      enum: {
        values: Object.values(AnnotationType),
        message: 'Type must be one of: highlight, note, bookmark',
      },
      index: true,
    },
    color: {
      type: String,
      validate: {
        validator: function(v: string | undefined) {
          if (!v) return true; // Optional field
          // Validate hex color format
          return /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Color must be a valid hex color (e.g., #FFF59D)',
      },
    },
    noteText: {
      type: String,
      maxlength: [5000, 'Note text cannot exceed 5000 characters'],
    },
    noteTitle: {
      type: String,
      maxlength: [200, 'Note title cannot exceed 200 characters'],
    },
    // Text range selection fields for partial verse annotations
    startOffset: {
      type: Number,
      min: [0, 'Start offset must be non-negative'],
    },
    endOffset: {
      type: Number,
      min: [0, 'End offset must be non-negative'],
      validate: {
        validator: function(this: IAnnotation, v: number | undefined) {
          if (v === undefined || this.startOffset === undefined) return true;
          return v > this.startOffset;
        },
        message: 'End offset must be greater than start offset',
      },
    },
    selectedText: {
      type: String,
      maxlength: [1000, 'Selected text cannot exceed 1000 characters'],
    },
    // Bible version tracking fields
    versionId: {
      type: Number,
      min: [1, 'Version ID must be positive'],
    },
    versionAbbreviation: {
      type: String,
      maxlength: [10, 'Version abbreviation cannot exceed 10 characters'],
    },
    languageCode: {
      type: String,
      maxlength: [10, 'Language code cannot exceed 10 characters'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Compound indexes for efficient queries
 */
// Index for fetching user's annotations sorted by date
AnnotationSchema.index({ userId: 1, createdAt: -1 });

// Index for fetching annotations for a specific verse
AnnotationSchema.index({ userId: 1, verseUsfm: 1 });

// Index for fetching annotations by type
AnnotationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Unique index to prevent duplicate bookmarks
AnnotationSchema.index(
  { userId: 1, verseUsfm: 1, type: 1 },
  { 
    unique: true,
    partialFilterExpression: { type: AnnotationType.BOOKMARK },
  }
);

/**
 * Pre-save validation
 */
AnnotationSchema.pre('save', function(next) {
  // Validate type-specific fields
  if (this.type === AnnotationType.HIGHLIGHT) {
    if (!this.color) {
      return next(new Error('Highlight annotations must have a color'));
    }
  }

  if (this.type === AnnotationType.NOTE) {
    if (!this.noteText || this.noteText.trim().length === 0) {
      return next(new Error('Note annotations must have noteText'));
    }
  }

  next();
});

/**
 * Static methods
 */
interface AnnotationModel extends Model<IAnnotation> {
  getUserAnnotations(userId: string | mongoose.Types.ObjectId): Promise<IAnnotation[]>;
  getVerseRangeAnnotations(
    userId: string | mongoose.Types.ObjectId,
    book: string,
    chapter: number
  ): Promise<IAnnotation[]>;
  getAnnotationsByType(
    userId: string | mongoose.Types.ObjectId,
    type: AnnotationType
  ): Promise<IAnnotation[]>;
  deleteVerseAnnotations(
    userId: string | mongoose.Types.ObjectId,
    verseUsfm: string
  ): Promise<number>;
}

/**
 * Get all annotations for a user
 */
AnnotationSchema.statics.getUserAnnotations = async function(
  userId: string | mongoose.Types.ObjectId
): Promise<IAnnotation[]> {
  return this.find({ userId: new mongoose.Types.ObjectId(userId.toString()) })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get annotations for a verse range (e.g., all verses in Genesis 1)
 */
AnnotationSchema.statics.getVerseRangeAnnotations = async function(
  userId: string | mongoose.Types.ObjectId,
  book: string,
  chapter: number
): Promise<IAnnotation[]> {
  const regex = new RegExp(`^${book.toUpperCase()}\\.${chapter}\\.\\d+$`);
  return this.find({
    userId: new mongoose.Types.ObjectId(userId.toString()),
    verseUsfm: regex,
  })
    .sort({ verseUsfm: 1 })
    .lean();
};

/**
 * Get annotations by type
 */
AnnotationSchema.statics.getAnnotationsByType = async function(
  userId: string | mongoose.Types.ObjectId,
  type: AnnotationType
): Promise<IAnnotation[]> {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId.toString()),
    type,
  })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Delete all annotations for a verse
 */
AnnotationSchema.statics.deleteVerseAnnotations = async function(
  userId: string | mongoose.Types.ObjectId,
  verseUsfm: string
): Promise<number> {
  const result = await this.deleteMany({
    userId: new mongoose.Types.ObjectId(userId.toString()),
    verseUsfm: verseUsfm.toUpperCase(),
  });
  return result.deletedCount || 0;
};

/**
 * Create and export the model
 */
const Annotation = mongoose.model<IAnnotation, AnnotationModel>('Annotation', AnnotationSchema);

export default Annotation;
