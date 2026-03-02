// src/models/User.ts
import mongoose, { Document, Schema } from "mongoose";

// The user that has created the ChurchDoc
interface User {
  name: string;
  email: string;
  _id: string;
  image: string;
}

interface Principal {
  pastor: string;
  wife: string;
  image: string;
  description: string;
}

interface Deacon {
  names: string;
  descriptions: string;
  image: string;
}

interface Trustee {
  names: string;
  descriptions: string;
  image: string;
}

interface Securities {
  deacons: Deacon[];
  trustees: Trustee[];
}

// Custom Section Interface - for flexible church sections (Musicians, Youth, etc.)
interface CustomSectionMember {
  names: string;
  descriptions: string;
  image: string;
}

interface CustomSection {
  sectionName: string; // e.g., "Musicians", "Youth Leaders", "Choir"
  members: CustomSectionMember[];
  createdAt?: Date;
}

// Upcoming Events Interface
interface UpcomingEvent {
  _id?: string;
  title: string;
  description?: string;
  date: Date;
  time?: string; // e.g., "10:00 AM - 12:00 PM"
  location?: string; // Optional different location from church
  image?: string;
  isRecurring?: boolean;
  recurringPattern?: 'weekly' | 'monthly' | 'yearly';
  createdAt?: Date;
}

interface LiveService {
  title: string;
  preacher: string;
  sermon: string;
}

interface Songs {
  title: string;
  songUrl: string;
}

// Contact Information Interface
interface ContactInfo {
  // Primary contact
  phoneNumber?: string;
  email?: string;
  website?: string;
  // Social media links
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  // Additional contact methods
  whatsapp?: string;
  telegram?: string;
}

// Address Interface
interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// ============================================================================
// BLOCK-BASED LAYOUT SYSTEM
// ============================================================================

type BlockType =
  | 'hero-banner' | 'leadership' | 'section-grid' | 'gallery' | 'video-gallery'
  | 'services' | 'events' | 'songs' | 'rich-text' | 'contact' | 'social-feed'
  | 'giving' | 'custom-embed' | 'container'
  | 'divider' | 'spacer' | 'heading' | 'cta-button' | 'badge-row' | 'quote'
  | 'countdown' | 'announcement-bar' | 'social-links' | 'map' | 'stats-row'
  | 'testimonial' | 'accordion';

interface BlockStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOverlay?: number;
  backgroundOverlayColor?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
  marginTop?: string;
  marginBottom?: string;
  layout?: string;
  columns?: number;
  cardStyle?: string;
  cardCorners?: string;
  titleColor?: string;
  titleAlignment?: string;
  subtitleColor?: string;
  textColor?: string;
  showDivider?: boolean;
  dividerStyle?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fullWidth?: boolean;
}

interface PageBlock {
  _id?: string;
  type: BlockType;
  order: number;
  visible: boolean;
  config: Record<string, any>;
  style?: BlockStyle;
  children?: PageBlock[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChurchTheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textPrimary?: string;
  textSecondary?: string;
  fontFamily?: string;
  headingStyle?: string;
  pageLayout?: string;
  cornerStyle?: string;
  spacing?: string;
  enableDarkMode?: boolean;
  enableShadows?: boolean;
  enableAnimations?: boolean;
}

// ============================================================================
// COMMUNITY PROFILE (social branding separate from page builder)
// ============================================================================

interface CommunityProfile {
  coverImage?: string;      // Wide banner/cover image
  logo?: string;            // Community-specific logo (overrides main logo)
  tagline?: string;         // Short tagline/bio (max 160 chars)
  description?: string;     // Longer about section for community
  accentColor?: string;     // Brand accent color for the social profile
  website?: string;         // Community-specific website or link
  isPublic?: boolean;       // Whether the community is publicly visible
  welcomeMessage?: string;  // Message shown to new members
  guidelines?: string;      // Community posting guidelines
  updatedAt?: Date;
}

export interface ChurchDoc extends Document {
  // liveTitle: string,
  // liveUrl: string,
  name: string;
  principal: Principal;
  location: string; // Full address string (for backward compatibility)
  image: string;
  banner: string[];
  securities: Securities;
  oldServices: LiveService[];
  liveServices: LiveService[];
  gallery: string[];
  songs: Songs[];
  logo: string;
  user: User;
  createdAt: Date;
  // Contact information (enhanced)
  contact?: ContactInfo;
  // Structured address (new)
  address?: Address;
  // Church details
  denomination?: string;
  description?: string; // Church description/about
  // Custom sections (flexible church sections like Musicians, Youth, etc.)
  customSections?: CustomSection[];
  // Upcoming events/calendar
  upcomingEvents?: UpcomingEvent[];
  // Block-based layout system
  pageBlocks?: PageBlock[];
  theme?: ChurchTheme;
  // Community social profile branding
  communityProfile?: CommunityProfile;
  // Legacy fields (kept for backward compatibility)
  phoneNumber?: string;
  email?: string;
  website?: string;
  city?: string;
  state?: string;
}

/**
 * URL Validation Helper
 * Checks if a string is a valid URL (http or https)
 */
const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const ChurchSchema: Schema = new Schema({
  name: { type: String, required: true, index: true }, // Index for searching churches by name
  principal: { type: Object, required: true },
  location: { type: String, required: true, index: true }, // Index for location-based queries
  image: { type: String, required: false }, // Optional - church main image can be removed
  banner: { type: [String], required: true },
  securities: { type: Object, required: true },
  oldServices: { type: [Object], required: true },
  liveServices: {
    type: [{
      date: { type: Date, default: Date.now }, // Date field for live services
      // Other fields for live services can go here if needed
      type: Object
    }],
    required: true
  },
  gallery: { type: [String], required: true },
  songs: { type: [Object], required: true },
  logo: { type: String, required: false }, // Optional - can be removed
  user: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, index: true }, // Index for sorting by creation date
  
  // Enhanced Contact Information (structured)
  contact: {
    type: {
      phoneNumber: { type: String },
      email: { type: String },
      website: { type: String },
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      youtube: { type: String },
      whatsapp: { type: String },
      telegram: { type: String }
    },
    required: false,
    default: {}
  },
  
  // Structured Address
  address: {
    type: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String }
    },
    required: false,
    default: {}
  },
  
  // Church details
  denomination: { type: String },
  description: { type: String }, // Church description/about section
  
  // Custom sections for flexible church organization (Musicians, Youth, etc.)
  customSections: {
    type: [{
      sectionName: { type: String, required: true },
      members: [{
        names: { type: String, required: true },
        descriptions: { type: String },
        image: { type: String }
      }],
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  
  // Upcoming Events / Calendar
  upcomingEvents: {
    type: [{
      title: { type: String, required: true },
      description: { type: String },
      date: { type: Date, required: true },
      time: { type: String }, // e.g., "10:00 AM - 12:00 PM"
      location: { type: String }, // Optional different location
      image: { type: String },
      isRecurring: { type: Boolean, default: false },
      recurringPattern: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  
  // Legacy contact fields (kept for backward compatibility)
  phoneNumber: { type: String },
  email: { type: String },
  website: { type: String },
  city: { type: String },
  state: { type: String },
  
  // ============================================================================
  // COMMUNITY SOCIAL PROFILE BRANDING
  // ============================================================================
  communityProfile: {
    type: {
      coverImage: { type: String },
      logo: { type: String },
      tagline: { type: String, maxlength: 160 },
      description: { type: String },          // Rich text (HTML) — no strict limit
      accentColor: { type: String, default: '#111111' },
      website: { type: String },
      isPublic: { type: Boolean, default: true },
      welcomeMessage: { type: String },        // Rich text (HTML)
      guidelines: { type: String },            // Rich text (HTML)
      updatedAt: { type: Date, default: Date.now },
    },
    required: false,
    default: {},
  },

  // ============================================================================
  // BLOCK-BASED LAYOUT SYSTEM
  // ============================================================================
  pageBlocks: {
    type: [{
      type: { type: String, required: true, enum: [
        'hero-banner', 'leadership', 'section-grid', 'gallery', 'video-gallery',
        'services', 'events', 'songs', 'rich-text', 'contact', 'social-feed',
        'giving', 'custom-embed', 'container',
        'divider', 'spacer', 'heading', 'cta-button', 'badge-row', 'quote',
        'countdown', 'announcement-bar', 'social-links', 'map', 'stats-row',
        'testimonial', 'accordion'
      ]},
      order: { type: Number, required: true, default: 0 },
      visible: { type: Boolean, default: true },
      config: { type: Schema.Types.Mixed, default: {} },
      style: {
        type: {
          backgroundColor: String,
          backgroundImage: String,
          backgroundOverlay: Number,
          backgroundOverlayColor: String,
          paddingVertical: { type: String, enum: ['none', 'small', 'medium', 'large', 'xlarge'] },
          paddingHorizontal: { type: String, enum: ['none', 'small', 'medium', 'large', 'xlarge'] },
          marginTop: { type: String, enum: ['none', 'small', 'medium', 'large', 'xlarge'] },
          marginBottom: { type: String, enum: ['none', 'small', 'medium', 'large', 'xlarge'] },
          layout: String,
          columns: Number,
          cardStyle: { type: String, enum: ['elevated', 'flat', 'outlined', 'glass', 'minimal'] },
          cardCorners: { type: String, enum: ['rounded', 'sharp', 'pill'] },
          titleColor: String,
          titleAlignment: { type: String, enum: ['left', 'center', 'right'] },
          textAlignment: { type: String, enum: ['left', 'center', 'right'] },
          subtitleColor: String,
          textColor: String,
          showDivider: Boolean,
          dividerStyle: { type: String, enum: ['line', 'dots', 'gradient', 'none', 'solid', 'dashed', 'dotted'] },
          borderColor: String,
          borderWidth: Number,
          borderRadius: Number,
          fullWidth: Boolean,
        },
        default: {}
      },
      children: { type: [Schema.Types.Mixed], default: [] },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }],
    default: []
  },
  
  // Church Theme / Branding
  theme: {
    type: {
      primaryColor: { type: String, default: '#1a1a2e' },
      secondaryColor: { type: String, default: '#e94560' },
      accentColor: { type: String, default: '#0f3460' },
      backgroundColor: { type: String, default: '#ffffff' },
      surfaceColor: { type: String, default: '#f5f5f5' },
      textPrimary: { type: String, default: '#000000' },
      textSecondary: { type: String, default: '#666666' },
      fontFamily: { type: String, enum: ['modern', 'classic', 'elegant', 'bold', 'minimal', 'handwritten', 'serif', 'sans-serif'], default: 'modern' },
      headingStyle: { type: String, enum: ['uppercase', 'normal', 'italic', 'elegant', 'bold', 'modern', 'clean'], default: 'normal' },
      buttonStyle: { type: String, enum: ['rounded', 'pill', 'square'], default: 'rounded' },
      cardStyle: { type: String, enum: ['elevated', 'flat', 'outlined', 'glass', 'minimal'], default: 'elevated' },
      pageLayout: { type: String, enum: ['full-width', 'contained', 'card-based', 'classic', 'magazine'], default: 'full-width' },
      cornerStyle: { type: String, enum: ['rounded', 'sharp', 'pill'], default: 'rounded' },
      spacing: { type: String, enum: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
      enableDarkMode: { type: Boolean, default: false },
      enableShadows: { type: Boolean, default: true },
      enableAnimations: { type: Boolean, default: true },
    },
    default: {
      primaryColor: '#1a1a2e', secondaryColor: '#e94560', accentColor: '#0f3460',
      backgroundColor: '#ffffff', surfaceColor: '#f5f5f5', textPrimary: '#000000', textSecondary: '#666666',
      fontFamily: 'modern', headingStyle: 'normal', pageLayout: 'full-width',
      cornerStyle: 'rounded', spacing: 'comfortable',
      enableDarkMode: false, enableShadows: true, enableAnimations: true,
    }
  },
});

// Index for finding churches by user ID (for user profile queries)
ChurchSchema.index({ 'user._id': 1 });

// Compound index for common queries (churches by location and creation date)
ChurchSchema.index({ location: 1, createdAt: -1 });
ChurchSchema.index({ name: 'text', location: 'text', 'address.city': 'text', denomination: 'text' }, { weights: { name: 10, location: 5, 'address.city': 3, denomination: 2 }, name: 'church_text_search' }); // Full-text search

// Pre-save validation hook to ensure URLs are valid
ChurchSchema.pre('save', function(next) {
  const church = this as ChurchDoc;
  
  // Validate oldServices sermon URLs
  if (church.oldServices && church.oldServices.length > 0) {
    for (let i = 0; i < church.oldServices.length; i++) {
      const service = church.oldServices[i];
      // Only validate if sermon exists AND is not empty
      if (service.sermon && service.sermon.trim() !== '' && !isValidUrl(service.sermon)) {
        return next(new Error(`oldServices[${i}].sermon must be a valid URL (e.g., https://example.com/sermon)`));
      }
    }
  }
  
  // Validate liveServices sermon URLs
  if (church.liveServices && church.liveServices.length > 0) {
    for (let i = 0; i < church.liveServices.length; i++) {
      const service = church.liveServices[i];
      // Only validate if sermon exists AND is not empty
      if (service.sermon && service.sermon.trim() !== '' && !isValidUrl(service.sermon)) {
        return next(new Error(`liveServices[${i}].sermon must be a valid URL (e.g., https://example.com/sermon)`));
      }
    }
  }
  
  // Validate contact URLs (website, social media)
  if (church.contact) {
    const urlFields = ['website', 'facebook', 'twitter', 'instagram', 'youtube'];
    for (const field of urlFields) {
      const value = (church.contact as any)[field];
      if (value && value.trim() !== '' && !isValidUrl(value)) {
        return next(new Error(`contact.${field} must be a valid URL (e.g., https://example.com)`));
      }
    }
  }
  
  // Validate legacy website field
  if (church.website && church.website.trim() !== '' && !isValidUrl(church.website)) {
    return next(new Error(`website must be a valid URL (e.g., https://example.com)`));
  }
  
  // Sync legacy fields with contact object for backward compatibility
  if (church.contact) {
    if (church.contact.phoneNumber && !church.phoneNumber) {
      church.phoneNumber = church.contact.phoneNumber;
    }
    if (church.contact.email && !church.email) {
      church.email = church.contact.email;
    }
    if (church.contact.website && !church.website) {
      church.website = church.contact.website;
    }
  }
  
  // Sync legacy address fields
  if (church.address) {
    if (church.address.city && !church.city) {
      church.city = church.address.city;
    }
    if (church.address.state && !church.state) {
      church.state = church.address.state;
    }
  }
  
  next();
});
// createdAt: { type: Date, default: Date.now, expires: '24h' }
export const ChurchModel = mongoose.model<ChurchDoc>("Church", ChurchSchema);
