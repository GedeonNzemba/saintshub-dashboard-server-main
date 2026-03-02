/**
 * Migration Script: Convert Base64 Images to Cloudinary URLs
 * 
 * Purpose: Process existing churches in database that have base64 embedded images
 * in their description fields and replace them with Cloudinary URLs.
 * 
 * This should be run once to clean up existing data.
 * 
 * Usage: ts-node src/scripts/migrateBase64Images.ts
 */

import mongoose from "mongoose";
import { ChurchModel } from "../models/Space";
import { processChurchDescriptions } from "../utils/processRichTextImages";
import connectDB from "../utils/db";

async function migrateChurches() {
  try {
    console.log('🚀 Starting base64 image migration...');
    
    // Connect to MongoDB using the same connection as the main app
    await connectDB();
    
    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    console.log('✅ Connected to MongoDB');
    
    // Find all churches
    const churches = await ChurchModel.find({});
    console.log(`📊 Found ${churches.length} churches to process`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < churches.length; i++) {
      const church = churches[i];
      console.log(`\n[${i + 1}/${churches.length}] Processing: ${church.name} (${church._id})`);
      
      try {
        // Check if church has any base64 content
        const churchObj = church.toObject();
        const hasBase64 = JSON.stringify(churchObj).includes('data:image') || JSON.stringify(churchObj).includes('data:video');
        
        if (!hasBase64) {
          console.log('  ⏭️  No base64 content found - skipping');
          skippedCount++;
          continue;
        }
        
        console.log('  🔄 Processing base64 content...');
        
        // Process descriptions
        const processedData = await processChurchDescriptions(churchObj);
        
        // Update church in database
        await ChurchModel.findByIdAndUpdate(
          church._id,
          processedData,
          { runValidators: true }
        );
        
        console.log('  ✅ Successfully processed and saved');
        processedCount++;
        
      } catch (error) {
        console.error(`  ❌ Error processing church ${church.name}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Churches: ${churches.length}`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`⏭️  Skipped (no base64): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Migration complete - disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateChurches();
