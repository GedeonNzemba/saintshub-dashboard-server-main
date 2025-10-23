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

interface LiveService {
  title: string;
  preacher: string;
  sermon: string;
}

interface Songs {
  title: string;
  songUrl: string;
}

export interface ChurchDoc extends Document {
  // liveTitle: string,
  // liveUrl: string,
  name: string;
  principal: Principal;
  location: string;
  image: string;
  banner: string[];
  securities: Securities;
  oldServices: LiveService[];
  liveServices: LiveService[];
  gallery: string[];
  songs: Songs[];
  logo: string;
  user: User;
  createdAt: Date
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
  image: { type: String, required: true },
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
  logo: { type: String, required: true },
  user: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, index: true } // Index for sorting by creation date
});

// Index for finding churches by user ID (for user profile queries)
ChurchSchema.index({ 'user._id': 1 });

// Compound index for common queries (churches by location and creation date)
ChurchSchema.index({ location: 1, createdAt: -1 });

// Pre-save validation hook to ensure sermon fields are valid URLs
// Only validates if sermon field contains a value (empty/undefined is allowed)
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
  
  next();
});
// createdAt: { type: Date, default: Date.now, expires: '24h' }
export const ChurchModel = mongoose.model<ChurchDoc>("Church", ChurchSchema);
