import {v2 as cloudinary} from "cloudinary"

// Load environment variables
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

// Check if essential Cloudinary environment variables are set
if (!cloud_name || !api_key || !api_secret) {
    console.error("FATAL ERROR: Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully defined.");
    // Optionally exit if Cloudinary is essential for startup
    // process.exit(1);
}

cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
});

export default cloudinary;