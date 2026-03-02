/**
 * Utility to process rich text HTML and replace base64 embedded images with R2 URLs
 * 
 * Purpose: Rich text editors often save images as base64 data URLs embedded in HTML.
 * This causes API responses to become extremely large (100s of KB to MBs), crashing mobile apps.
 * 
 * Solution: Extract base64 images, upload to Cloudflare R2, replace with CDN URLs
 * 
 * Usage:
 * ```typescript
 * const processedHtml = await processRichTextImages(htmlContent);
 * ```
 */

import { uploadMedia } from '../services/mediaService';
import crypto from "crypto";

/**
 * Extract all base64 images from HTML content
 * Finds: <img src="data:image/...;base64,..." />
 */
function extractBase64Images(html: string): Array<{ full: string; mimeType: string; base64Data: string }> {
  const base64ImageRegex = /<img[^>]+src="data:image\/(jpeg|jpg|png|gif|webp);base64,([^"]+)"/gi;
  const images: Array<{ full: string; mimeType: string; base64Data: string }> = [];
  
  let match;
  while ((match = base64ImageRegex.exec(html)) !== null) {
    images.push({
      full: match[0], // Full img tag
      mimeType: match[1], // jpeg, png, etc
      base64Data: match[2] // The actual base64 string
    });
  }
  
  console.log(`🔍 Found ${images.length} base64 images in HTML`);
  return images;
}

/**
 * Extract all base64 videos from HTML content
 * Finds: <video src="data:video/...;base64,..." /> or <source src="data:video/...;base64,..." />
 */
function extractBase64Videos(html: string): Array<{ full: string; mimeType: string; base64Data: string }> {
  const base64VideoRegex = /<(?:video|source)[^>]+src="data:video\/(mp4|webm|ogg);base64,([^"]+)"/gi;
  const videos: Array<{ full: string; mimeType: string; base64Data: string }> = [];
  
  let match;
  while ((match = base64VideoRegex.exec(html)) !== null) {
    videos.push({
      full: match[0],
      mimeType: match[1], // mp4, webm, etc
      base64Data: match[2]
    });
  }
  
  console.log(`🔍 Found ${videos.length} base64 videos in HTML`);
  return videos;
}

/**
 * Upload base64 data to R2 via the media service
 */
async function uploadBase64ToR2(base64Data: string, mimeType: string, resourceType: 'image' | 'video' = 'image'): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType === 'gif' ? 'gif' : mimeType === 'png' ? 'png' : mimeType === 'webp' ? 'webp' : mimeType;
    const fullMime = resourceType === 'video' ? `video/${mimeType}` : `image/${mimeType}`;
    const fileName = `richtext_${crypto.randomBytes(8).toString('hex')}.${ext}`;

    console.log(`📤 Uploading ${resourceType} to R2 (${(buffer.length / 1024).toFixed(2)} KB)...`);

    const result = await uploadMedia({
      scope: 'system',
      file: buffer,
      fileName,
      mimeType: fullMime,
      category: 'churches/images',
      skipQuota: true, // System uploads bypass quota
    });

    console.log(`✅ Uploaded to R2: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error(`❌ Failed to upload ${resourceType} to R2:`, error);
    throw error;
  }
}

/**
 * Process HTML content: Replace all base64 images/videos with R2 CDN URLs
 */
export async function processRichTextImages(html: string): Promise<string> {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Check if HTML contains base64 images/videos
  const hasBase64Content = html.includes('data:image') || html.includes('data:video');
  
  if (!hasBase64Content) {
    console.log('✅ No base64 content found in HTML - skipping processing');
    return html;
  }

  console.log('🔄 Processing rich text HTML with base64 content...');
  console.log(`📊 Original HTML size: ${(html.length / 1024).toFixed(2)} KB`);

  let processedHtml = html;

  try {
    // Process images
    const images = extractBase64Images(html);
    
    for (const image of images) {
      try {
        const r2Url = await uploadBase64ToR2(image.base64Data, image.mimeType, 'image');
        
        // Replace base64 img tag with R2 URL
        // Preserve other attributes if they exist
        const newImgTag = image.full.replace(
          /src="data:image\/[^;]+;base64,[^"]+"/,
          `src="${r2Url}"`
        );
        
        processedHtml = processedHtml.replace(image.full, newImgTag);
      } catch (error) {
        console.error('❌ Failed to process image, keeping original:', error);
      }
    }

    // Process videos
    const videos = extractBase64Videos(html);
    
    for (const video of videos) {
      try {
        const r2Url = await uploadBase64ToR2(video.base64Data, video.mimeType, 'video');
        
        // Replace base64 video/source tag with R2 URL
        const newTag = video.full.replace(
          /src="data:video\/[^;]+;base64,[^"]+"/,
          `src="${r2Url}"`
        );
        
        processedHtml = processedHtml.replace(video.full, newTag);
      } catch (error) {
        console.error('❌ Failed to process video, keeping original:', error);
      }
    }

    console.log(`📊 Processed HTML size: ${(processedHtml.length / 1024).toFixed(2)} KB`);
    console.log(`📉 Size reduction: ${((1 - processedHtml.length / html.length) * 100).toFixed(1)}%`);

    return processedHtml;
  } catch (error) {
    console.error('❌ Error processing rich text images:', error);
    // Return original HTML if processing fails
    return html;
  }
}

/**
 * Process church data: Find all description fields and process them
 * Handles: principal.description, deacon.descriptions, trustee.descriptions
 */
export async function processChurchDescriptions(churchData: any): Promise<any> {
  console.log('🔄 Processing church descriptions for base64 content...');

  // Process principal description
  if (churchData.principal?.description) {
    console.log('📝 Processing principal.description...');
    churchData.principal.description = await processRichTextImages(churchData.principal.description);
  }

  // Process deacon descriptions
  if (churchData.securities?.deacons && Array.isArray(churchData.securities.deacons)) {
    console.log(`📝 Processing ${churchData.securities.deacons.length} deacon descriptions...`);
    for (const deacon of churchData.securities.deacons) {
      if (deacon.descriptions) {
        deacon.descriptions = await processRichTextImages(deacon.descriptions);
      }
    }
  }

  // Process trustee descriptions
  if (churchData.securities?.trustees && Array.isArray(churchData.securities.trustees)) {
    console.log(`📝 Processing ${churchData.securities.trustees.length} trustee descriptions...`);
    for (const trustee of churchData.securities.trustees) {
      if (trustee.descriptions) {
        trustee.descriptions = await processRichTextImages(trustee.descriptions);
      }
    }
  }

  // Process custom sections member descriptions
  if (churchData.customSections && Array.isArray(churchData.customSections)) {
    console.log(`📝 Processing ${churchData.customSections.length} custom sections...`);
    for (const section of churchData.customSections) {
      if (section.members && Array.isArray(section.members)) {
        console.log(`  Processing ${section.members.length} members in section "${section.sectionName}"...`);
        for (const member of section.members) {
          if (member.descriptions) {
            member.descriptions = await processRichTextImages(member.descriptions);
          }
        }
      }
    }
  }

  // Process general church description if it exists
  if (churchData.description) {
    console.log('📝 Processing church.description...');
    churchData.description = await processRichTextImages(churchData.description);
  }

  console.log('✅ Church description processing complete');
  return churchData;
}
