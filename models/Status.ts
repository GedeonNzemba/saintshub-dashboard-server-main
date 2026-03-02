import mongoose, { Document, Schema } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

export interface StatusTextBlock {
  id: string;
  text: string;
  fontPresetIdx: number;
  textColor: string;
  textAlign: string;
  position: { x: number; y: number };
}

export interface StatusSticker {
  id: string;
  emoji: string;
  label: string;
  position: { x: number; y: number };
}

export interface StatusMusic {
  trackId: string;
  name: string;
  artist: string;
  albumArt?: string;
  durationMs?: number;
}

export interface StatusDoc extends Document {
  churchId?: mongoose.Types.ObjectId;  // Optional — null for user-level stories
  churchName?: string;
  churchLogo?: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  isUserStatus?: boolean;              // true = personal story, false = church story

  type: 'text' | 'image' | 'video';
  content: {
    text?: string;
    media?: {
      url: string;
      thumbnail?: string;
    };
    backgroundColor?: string;
    textColor?: string;
    fontStyle?: string;
    gradientColors?: [string, string];  // 2-color gradient pair
  };

  // Rich elements
  textBlocks?: StatusTextBlock[];
  stickers?: StatusSticker[];
  music?: StatusMusic;

  expiresAt: Date;
  viewsCount: number;

  reactions: {
    userId: mongoose.Types.ObjectId;
    type: string;
    createdAt: Date;
  }[];

  viewers: mongoose.Types.ObjectId[];

  createdAt: Date;
}

// ============================================================================
// SCHEMA
// ============================================================================

const StatusSchema = new Schema<StatusDoc>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: false,   // Optional for user-level stories
      index: true,
    },
    churchName: { type: String },
    churchLogo: { type: String },
    isUserStatus: { type: Boolean, default: false },

    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },

    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      required: true,
    },

    content: {
      text: { type: String, maxlength: 2000 },
      media: {
        url: { type: String },
        thumbnail: { type: String },
      },
      backgroundColor: { type: String, default: '#000000' },
      textColor: { type: String, default: '#ffffff' },
      fontStyle: {
        type: String,
        enum: ['normal', 'bold', 'italic'],
        default: 'normal',
      },
      gradientColors: { type: [String], default: undefined },
    },

    textBlocks: [{
      id: { type: String, required: true },
      text: { type: String, required: true },
      fontPresetIdx: { type: Number, default: 0 },
      textColor: { type: String, default: '#FFFFFF' },
      textAlign: { type: String, default: 'center' },
      position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      },
    }],

    stickers: [{
      id: { type: String, required: true },
      emoji: { type: String, required: true },
      label: { type: String },
      position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      },
    }],

    music: {
      trackId: { type: String },
      name: { type: String },
      artist: { type: String },
      albumArt: { type: String },
      durationMs: { type: Number },
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    viewsCount: { type: Number, default: 0 },

    reactions: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      type: {
        type: String,
        enum: ['like', 'love', 'pray', 'amen', 'celebrate'],
        default: 'like',
      },
      createdAt: { type: Date, default: Date.now },
    }],

    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index: auto-delete expired statuses
StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Church's active statuses
StatusSchema.index({ churchId: 1, expiresAt: -1 });

// User's active statuses (for personal stories)
StatusSchema.index({ authorId: 1, isUserStatus: 1, expiresAt: -1 });

// Auto-set expiresAt to 24 hours from creation
StatusSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    this.expiresAt = expiry;
  }
  next();
});

export const StatusModel = mongoose.model<StatusDoc>('Status', StatusSchema);
