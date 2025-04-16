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

const ChurchSchema: Schema = new Schema({
  name: { type: String, required: true },
  principal: { type: Object, required: true },
  location: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now}
});
// createdAt: { type: Date, default: Date.now, expires: '24h' }
export const ChurchModel = mongoose.model<ChurchDoc>("Church", ChurchSchema);
