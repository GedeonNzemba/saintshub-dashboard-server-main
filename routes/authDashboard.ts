import express, { Request, Response } from "express";
import { ChurchDoc, ChurchModel } from "../models/Space";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";
import dashboardController from "../controllers/dashboardController";
import User from "../models/User";
import { validateCreateChurch, validateUpdateChurch } from "../middlewares/validators";
import { cacheMiddleware, invalidateCacheOnUpdate } from "../middlewares/cacheMiddleware";
import { checkChurchOwnership, addOwnershipInfo } from "../middlewares/churchOwnershipMiddleware";
import { processChurchDescriptions } from "../utils/processRichTextImages";

interface AuthRequest extends Request {
  userId?: string;
  body: ChurchDoc;
}

interface ChurchParams {
  id: string;
  field: string;
}

interface ChurchParamsA {
  id: string;
}

const router = express.Router();

/**
 * Create a New Church
 * 
 * Security:
 * - Requires authentication (authMiddleware)
 * - Requires admin privileges (adminMiddleware)
 * - Auto-populates user info from authenticated session
 * 
 * User Field:
 * - System automatically associates the logged-in user as the church creator
 * - Client should NOT send user data in request body
 * - User info is fetched from database based on JWT token
 * 
 * Access Control:
 * - Only admin or isAdminCandidate users can create churches
 * - Regular users will receive 403 Forbidden
 */
router.post("/create-church", authMiddleware, adminMiddleware, validateCreateChurch, async (req: AuthRequest, res: Response) => {
  try {
    // Validate required fields
    const { 
      name, 
      principal, 
      location, 
      image, 
      banner, 
      securities, 
      oldServices, 
      liveServices, 
      gallery, 
      songs, 
      logo,
      // New fields
      contact,
      address,
      denomination,
      description
    } = req.body;

    if (!name || !principal || !location) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["name", "principal", "location"],
        message: "Please provide all required church information"
      });
    }

    // Fetch authenticated user's information from database
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: "User not found",
        message: "Unable to identify the church creator. Please log in again."
      });
    }

    // Prepare church data with auto-populated user info
    const churchData = {
      name,
      principal,
      location,
      image: image || "",
      banner: banner || [],
      securities: securities || { deacons: [], trustees: [] },
      oldServices: oldServices || [],
      liveServices: liveServices || [],
      gallery: gallery || [],
      songs: songs || [],
      logo: logo || "",
      // New fields
      contact: contact || {},
      address: address || {},
      denomination: denomination || "",
      description: description || "",
      // AUTO-POPULATE: User info from authenticated session
      user: {
        name: user.name,
        email: user.email,
        _id: user._id.toString(),
        image: user.avatar?.url || ""
      }
    };

    // CRITICAL: Process descriptions to replace base64 images with R2 CDN URLs
    // This prevents huge API responses that crash mobile apps
    console.log('🔄 Processing rich text descriptions...');
    const processedChurchData = await processChurchDescriptions(churchData);

    // Create church in database
    const newChurch = await ChurchModel.create(processedChurchData);

    res.status(201).json({
      message: "Church created successfully!",
      church: newChurch
    });
  } catch (error: any) {
    console.error("Error creating church:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation Error",
        details: error.errors,
        message: "Please check your input data"
      });
    }

    // Handle custom validation errors (like sermon URL validation)
    if (error.message && error.message.includes('sermon must be a valid URL')) {
      return res.status(400).json({ 
        error: "Validation Error",
        message: error.message,
        hint: "Sermon field should be a valid URL (https://...) or left empty"
      });
    }

    // Generic server error
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to create church. Please try again.",
      details: error.message // Include error message for debugging
    });
  }
});

// Update a specific field in the church document
// Requires authentication and ownership verification
router.patch("/churches/:id/:field", authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const { id, field } = req.params;
    const updateData = { [field]: req.body[field] };
    
    // Validate that the field exists in the request body
    if (req.body[field] === undefined) {
      return res.status(400).json({ 
        message: `Missing value for field '${field}'`,
        error: "Bad Request"
      });
    }
    
    // CRITICAL: Process descriptions to replace base64 images with R2 CDN URLs
    console.log(`🔄 Processing field update: ${field}`);
    const processedData = await processChurchDescriptions(updateData);
    
    const updatedChurch = await ChurchModel.findByIdAndUpdate(id, processedData, { new: true });
    
    if (!updatedChurch) {
      return res.status(404).json({ 
        message: "Church not found",
        error: "Not Found"
      });
    }
    
    res.json({
      message: `Church ${field} updated successfully`,
      church: updatedChurch
    });
  } catch (error) {
    console.error('Error updating church field:', error);
    res.status(500).json({ 
      message: "Failed to update church field",
      error: "Internal Server Error" 
    });
  }
});

// Update multiple fields in the church document
// Requires authentication and ownership verification
// Invalidates church cache on successful update
router.patch('/churches/:id', authMiddleware, checkChurchOwnership, validateUpdateChurch, invalidateCacheOnUpdate('/churches'), async (req: Request, res: Response) => {
  const churchId = req.params.id;
  const updatedData = req.body;

  try {
    if (!updatedData || Object.keys(updatedData).length === 0) {
      return res.status(400).json({ 
        message: "No data provided for update",
        error: "Bad Request"
      });
    }

    // CRITICAL: Process descriptions to replace base64 images with R2 CDN URLs
    console.log('🔄 Processing rich text descriptions in update...');
    console.log('📦 Received payload keys:', Object.keys(updatedData));
    console.log('📝 Received principal:', updatedData.principal);
    console.log('📏 BEFORE processing - description length:', updatedData.principal?.description?.length);
    console.log('📝 BEFORE processing - description content:', updatedData.principal?.description);
    
    const processedData = await processChurchDescriptions(updatedData);

    console.log('📏 AFTER processing - description length:', processedData.principal?.description?.length);
    console.log('📝 AFTER processing - description content:', processedData.principal?.description);
    console.log('💾 Processed payload - principal.description:', processedData.principal?.description?.substring(0, 100));

    // Prepare update operations
    const updateOps: any = {};
    const unsetOps: any = {};

    // Separate null/undefined values for $unset operation
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === null || processedData[key] === undefined) {
        unsetOps[key] = '';
      } else {
        updateOps[key] = processedData[key];
      }
    });

    // Build final update query
    const updateQuery: any = {};
    if (Object.keys(updateOps).length > 0) {
      updateQuery.$set = updateOps;
    }
    if (Object.keys(unsetOps).length > 0) {
      updateQuery.$unset = unsetOps;
    }

    const updatedChurch = await ChurchModel.findByIdAndUpdate(
      churchId, 
      updateQuery,
      { new: true, runValidators: false } // Disable validators for $unset operations
    );

    if (!updatedChurch) {
      return res.status(404).json({ 
        message: "Church not found",
        error: "Not Found"
      });
    }

    console.log('✅ Church updated in DB - principal.description:', updatedChurch.principal?.description?.substring(0, 100));
    console.log('📊 DB saved - description length:', updatedChurch.principal?.description?.length);
    console.log('📊 DB saved - LAST 100 chars:', updatedChurch.principal?.description?.substring(updatedChurch.principal?.description?.length - 100));

    res.json({
      message: "Church updated successfully",
      church: updatedChurch
    });
  } catch (error: any) {
    console.error('Error updating church:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error",
        details: error.message,
        error: "Bad Request"
      });
    }
    
    res.status(500).json({ 
      message: "Failed to update church",
      error: "Internal Server Error"
    });
  }
});

// DELETE CHURCH
// Requires authentication and ownership verification
router.delete('/church/:id', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.id;

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found'
      });
    }

    await ChurchModel.findByIdAndDelete(churchId);

    res.json({ 
      message: 'Church deleted successfully',
      deletedChurchId: churchId,
      deletedChurchName: church.name
    });
  } catch (error) {
    console.error('Error removing church:', error);
    res.status(500).json({ 
      message: 'Failed to delete church',
      error: 'Internal server error'
    });
  }
});

// Delete gallery image by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/gallery/:imageIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const imageIndex = parseInt(req.params.imageIndex);

    if (isNaN(imageIndex)) {
      return res.status(400).json({ 
        message: 'Invalid image index',
        error: 'Bad Request'
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found'
      });
    }

    if (imageIndex < 0 || imageIndex >= church.gallery.length) {
      return res.status(400).json({ 
        message: `Invalid image index. Valid range: 0-${church.gallery.length - 1}`,
        error: 'Bad Request'
      });
    }

    church.gallery.splice(imageIndex, 1);
    await church.save();

    res.json({ 
      message: 'Gallery image deleted successfully',
      remainingImages: church.gallery.length
    });
  } catch (error) {
    console.error('Error removing gallery image:', error);
    res.status(500).json({ 
      message: 'Failed to delete gallery image',
      error: 'Internal server error'
    });
  }
});

// Delete banner image by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/banner/:imageIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const imageIndex = parseInt(req.params.imageIndex);

    if (isNaN(imageIndex)) {
      return res.status(400).json({ 
        message: 'Invalid banner index',
        error: 'Bad Request'
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found'
      });
    }

    // FIX: Check banner.length instead of gallery.length
    if (imageIndex < 0 || imageIndex >= church.banner.length) {
      return res.status(400).json({ 
        message: `Invalid banner index. Valid range: 0-${church.banner.length - 1}`,
        error: 'Bad Request'
      });
    }

    church.banner.splice(imageIndex, 1);
    await church.save();

    res.json({ 
      message: 'Banner image deleted successfully',
      remainingBanners: church.banner.length
    });
  } catch (error) {
    console.error('Error removing banner image:', error);
    res.status(500).json({ 
      message: 'Failed to delete banner image',
      error: 'Internal server error'
    });
  }
});

// Delete past service by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/past-service/:serviceIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const serviceIndex = parseInt(req.params.serviceIndex);

    if (isNaN(serviceIndex)) {
      return res.status(400).json({ 
        message: 'Invalid service index',
        error: 'Bad Request'
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found'
      });
    }

    if (serviceIndex < 0 || serviceIndex >= church.oldServices.length) {
      return res.status(400).json({ 
        message: `Invalid service index. Valid range: 0-${church.oldServices.length - 1}`,
        error: 'Bad Request'
      });
    }

    church.oldServices.splice(serviceIndex, 1);
    await church.save();

    res.json({ 
      message: 'Past service deleted successfully',
      remainingServices: church.oldServices.length
    });
  } catch (error) {
    console.error('Error removing service:', error);
    res.status(500).json({ 
      message: 'Failed to delete past service',
      error: 'Internal server error'
    });
  }
});


// Delete deacon by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/deacon/:deaconIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const deaconIndex = parseInt(req.params.deaconIndex);

    if (isNaN(deaconIndex)) {
      return res.status(400).json({ 
        message: 'Invalid deacon index',
        error: 'Bad Request' 
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found' 
      });
    }

    if (deaconIndex < 0 || deaconIndex >= church.securities.deacons.length) {
      return res.status(400).json({ 
        message: `Invalid deacon index. Valid range: 0-${church.securities.deacons.length - 1}`,
        error: 'Bad Request' 
      });
    }

    // Remove deacon from array
    church.securities.deacons.splice(deaconIndex, 1);

    // IMPORTANT: Mark the nested object as modified for Mongoose to save it
    church.markModified('securities');

    await church.save();

    res.json({ 
      message: 'Deacon deleted successfully',
      remainingDeacons: church.securities.deacons.length
    });
  } catch (error) {
    console.error('Error removing deacon:', error);
    res.status(500).json({ 
      message: 'Failed to delete deacon',
      error: 'Internal server error' 
    });
  }
});

// Delete trustee by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/trustee/:trusteeIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const trusteeIndex = parseInt(req.params.trusteeIndex);

    if (isNaN(trusteeIndex)) {
      return res.status(400).json({ 
        message: 'Invalid trustee index',
        error: 'Bad Request' 
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found' 
      });
    }

    if (trusteeIndex < 0 || trusteeIndex >= church.securities.trustees.length) {
      return res.status(400).json({ 
        message: `Invalid trustee index. Valid range: 0-${church.securities.trustees.length - 1}`,
        error: 'Bad Request' 
      });
    }

    // Remove trustee from array
    church.securities.trustees.splice(trusteeIndex, 1);

    // IMPORTANT: Mark the nested object as modified for Mongoose to save it
    church.markModified('securities');

    await church.save();

    res.json({ 
      message: 'Trustee deleted successfully',
      remainingTrustees: church.securities.trustees.length
    });
  } catch (error) {
    console.error('Error removing trustee:', error);
    res.status(500).json({ 
      message: 'Failed to delete trustee',
      error: 'Internal server error'
    });
  }
});

// Delete song by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/song/:songIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const songIndex = parseInt(req.params.songIndex);

    if (isNaN(songIndex)) {
      return res.status(400).json({ 
        message: 'Invalid song index',
        error: 'Bad Request'
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found'
      });
    }

    if (songIndex < 0 || songIndex >= church.songs.length) {
      return res.status(400).json({ 
        message: `Invalid song index. Valid range: 0-${church.songs.length - 1}`,
        error: 'Bad Request'
      });
    }

    church.songs.splice(songIndex, 1);
    await church.save();

    res.json({ 
      message: 'Song deleted successfully',
      remainingSongs: church.songs.length
    });
  } catch (error) {
    console.error('Error removing song:', error);
    res.status(500).json({ 
      message: 'Failed to delete song',
      error: 'Internal server error'
    });
  }
});

// Delete live service by index
// Requires authentication and ownership verification
router.delete('/churches/:churchId/live/:liveIndex', authMiddleware, checkChurchOwnership, async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const liveIndex = parseInt(req.params.liveIndex);

    if (isNaN(liveIndex)) {
      return res.status(400).json({ 
        message: 'Invalid live service index',
        error: 'Bad Request'
      });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ 
        message: 'Church not found',
        error: 'Not Found'
      });
    }

    if (liveIndex < 0 || liveIndex >= church.liveServices.length) {
      return res.status(400).json({ 
        message: `Invalid live service index. Valid range: 0-${church.liveServices.length - 1}`,
        error: 'Bad Request'
      });
    }

    church.liveServices.splice(liveIndex, 1);
    await church.save();

    res.json({ 
      message: 'Live service deleted successfully',
      remainingLiveServices: church.liveServices.length
    });
  } catch (error) {
    console.error('Error removing live service:', error);
    res.status(500).json({ 
      message: 'Failed to delete live service',
      error: 'Internal server error'
    });
  }
});

// ========================================
// CUSTOM SECTIONS MANAGEMENT
// ========================================

/**
 * Create a new custom section
 * POST /api/dashboard/churches/:churchId/custom-sections
 * 
 * Purpose: Create flexible church sections (Musicians, Youth Leaders, Choir, etc.)
 * Admins can define custom section names and add members
 */
router.post('/churches/:churchId/custom-sections', 
  authMiddleware, 
  checkChurchOwnership, 
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const { sectionName, members } = req.body;

      if (!sectionName || !sectionName.trim()) {
        return res.status(400).json({ 
          message: 'Section name is required',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({ 
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      // Check if section name already exists
      const existingSection = church.customSections?.find(
        section => section.sectionName.toLowerCase() === sectionName.trim().toLowerCase()
      );

      if (existingSection) {
        return res.status(400).json({ 
          message: `Section "${sectionName}" already exists`,
          error: 'Bad Request'
        });
      }

      // Create new section
      const newSection = {
        sectionName: sectionName.trim(),
        members: members || [],
        createdAt: new Date()
      };

      if (!church.customSections) {
        church.customSections = [];
      }

      church.customSections.push(newSection);
      church.markModified('customSections');
      
      await church.save();

      res.status(201).json({ 
        message: 'Custom section created successfully',
        section: newSection,
        totalSections: church.customSections.length
      });
    } catch (error) {
      console.error('Error creating custom section:', error);
      res.status(500).json({ 
        message: 'Failed to create custom section',
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Add member to custom section
 * POST /api/dashboard/churches/:churchId/custom-sections/:sectionIndex/members
 * 
 * Purpose: Add a new member to an existing custom section
 */
router.post('/churches/:churchId/custom-sections/:sectionIndex/members', 
  authMiddleware, 
  checkChurchOwnership, 
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const sectionIndex = parseInt(req.params.sectionIndex);
      const { names, descriptions, image } = req.body;

      if (isNaN(sectionIndex)) {
        return res.status(400).json({ 
          message: 'Invalid section index',
          error: 'Bad Request'
        });
      }

      if (!names || !names.trim()) {
        return res.status(400).json({ 
          message: 'Member name is required',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({ 
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.customSections || sectionIndex < 0 || sectionIndex >= church.customSections.length) {
        return res.status(400).json({ 
          message: `Invalid section index. Valid range: 0-${(church.customSections?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      const newMember = {
        names: names.trim(),
        descriptions: descriptions || '',
        image: image || ''
      };

      church.customSections[sectionIndex].members.push(newMember);
      church.markModified('customSections');
      
      await church.save();

      res.status(201).json({ 
        message: 'Member added successfully',
        member: newMember,
        sectionName: church.customSections[sectionIndex].sectionName,
        totalMembers: church.customSections[sectionIndex].members.length
      });
    } catch (error) {
      console.error('Error adding member to custom section:', error);
      res.status(500).json({ 
        message: 'Failed to add member',
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Update custom section name
 * PATCH /api/dashboard/churches/:churchId/custom-sections/:sectionIndex
 * 
 * Purpose: Update the name of a custom section
 */
router.patch('/churches/:churchId/custom-sections/:sectionIndex', 
  authMiddleware, 
  checkChurchOwnership, 
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const sectionIndex = parseInt(req.params.sectionIndex);
      const { sectionName } = req.body;

      if (isNaN(sectionIndex)) {
        return res.status(400).json({ 
          message: 'Invalid section index',
          error: 'Bad Request'
        });
      }

      if (!sectionName || !sectionName.trim()) {
        return res.status(400).json({ 
          message: 'Section name is required',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({ 
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.customSections || sectionIndex < 0 || sectionIndex >= church.customSections.length) {
        return res.status(400).json({ 
          message: `Invalid section index. Valid range: 0-${(church.customSections?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      // Check if new name conflicts with existing sections
      const conflictingSection = church.customSections.find(
        (section, idx) => idx !== sectionIndex && 
        section.sectionName.toLowerCase() === sectionName.trim().toLowerCase()
      );

      if (conflictingSection) {
        return res.status(400).json({ 
          message: `Section "${sectionName}" already exists`,
          error: 'Bad Request'
        });
      }

      const oldName = church.customSections[sectionIndex].sectionName;
      church.customSections[sectionIndex].sectionName = sectionName.trim();
      church.markModified('customSections');
      
      await church.save();

      res.json({ 
        message: 'Section name updated successfully',
        oldName,
        newName: sectionName.trim()
      });
    } catch (error) {
      console.error('Error updating custom section:', error);
      res.status(500).json({ 
        message: 'Failed to update section name',
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Update member in custom section
 * PATCH /api/dashboard/churches/:churchId/custom-sections/:sectionIndex/members/:memberIndex
 * 
 * Purpose: Update a member's information within a custom section
 */
router.patch('/churches/:churchId/custom-sections/:sectionIndex/members/:memberIndex', 
  authMiddleware, 
  checkChurchOwnership, 
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const sectionIndex = parseInt(req.params.sectionIndex);
      const memberIndex = parseInt(req.params.memberIndex);
      const { names, descriptions, image } = req.body;

      if (isNaN(sectionIndex) || isNaN(memberIndex)) {
        return res.status(400).json({ 
          message: 'Invalid section or member index',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({ 
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.customSections || sectionIndex < 0 || sectionIndex >= church.customSections.length) {
        return res.status(400).json({ 
          message: `Invalid section index. Valid range: 0-${(church.customSections?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      const section = church.customSections[sectionIndex];
      
      if (memberIndex < 0 || memberIndex >= section.members.length) {
        return res.status(400).json({ 
          message: `Invalid member index. Valid range: 0-${section.members.length - 1}`,
          error: 'Bad Request'
        });
      }

      // Update member fields
      if (names !== undefined) section.members[memberIndex].names = names;
      if (descriptions !== undefined) section.members[memberIndex].descriptions = descriptions;
      if (image !== undefined) section.members[memberIndex].image = image;

      church.markModified('customSections');
      await church.save();

      res.json({ 
        message: 'Member updated successfully',
        member: section.members[memberIndex],
        sectionName: section.sectionName
      });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ 
        message: 'Failed to update member',
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Delete custom section
 * DELETE /api/dashboard/churches/:churchId/custom-sections/:sectionIndex
 * 
 * Purpose: Remove an entire custom section
 */
router.delete('/churches/:churchId/custom-sections/:sectionIndex', 
  authMiddleware, 
  checkChurchOwnership, 
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const sectionIndex = parseInt(req.params.sectionIndex);

      if (isNaN(sectionIndex)) {
        return res.status(400).json({ 
          message: 'Invalid section index',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({ 
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.customSections || sectionIndex < 0 || sectionIndex >= church.customSections.length) {
        return res.status(400).json({ 
          message: `Invalid section index. Valid range: 0-${(church.customSections?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      const deletedSection = church.customSections[sectionIndex];
      church.customSections.splice(sectionIndex, 1);
      church.markModified('customSections');
      
      await church.save();

      res.json({ 
        message: 'Custom section deleted successfully',
        deletedSection: deletedSection.sectionName,
        remainingSections: church.customSections.length
      });
    } catch (error) {
      console.error('Error deleting custom section:', error);
      res.status(500).json({ 
        message: 'Failed to delete custom section',
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Delete member from custom section
 * DELETE /api/dashboard/churches/:churchId/custom-sections/:sectionIndex/members/:memberIndex
 * 
 * Purpose: Remove a member from a custom section
 */
router.delete('/churches/:churchId/custom-sections/:sectionIndex/members/:memberIndex', 
  authMiddleware, 
  checkChurchOwnership, 
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const sectionIndex = parseInt(req.params.sectionIndex);
      const memberIndex = parseInt(req.params.memberIndex);

      if (isNaN(sectionIndex) || isNaN(memberIndex)) {
        return res.status(400).json({ 
          message: 'Invalid section or member index',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({ 
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.customSections || sectionIndex < 0 || sectionIndex >= church.customSections.length) {
        return res.status(400).json({ 
          message: `Invalid section index. Valid range: 0-${(church.customSections?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      const section = church.customSections[sectionIndex];
      
      if (memberIndex < 0 || memberIndex >= section.members.length) {
        return res.status(400).json({ 
          message: `Invalid member index. Valid range: 0-${section.members.length - 1}`,
          error: 'Bad Request'
        });
      }

      const deletedMember = section.members[memberIndex];
      section.members.splice(memberIndex, 1);
      church.markModified('customSections');
      
      await church.save();

      res.json({ 
        message: 'Member deleted successfully',
        deletedMember: deletedMember.names,
        sectionName: section.sectionName,
        remainingMembers: section.members.length
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ 
        message: 'Failed to delete member',
        error: 'Internal server error'
      });
    }
  }
);

// ========================================
// UPCOMING EVENTS MANAGEMENT
// ========================================

/**
 * Get all events for a church
 * GET /api/dashboard/churches/:churchId/events
 */
router.get('/churches/:churchId/events',
  authMiddleware,
  async (req, res) => {
    try {
      const churchId = req.params.churchId;

      const church = await ChurchModel.findById(churchId)
        .select('upcomingEvents name')
        .lean();

      if (!church) {
        return res.status(404).json({
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      // Sort events by date (upcoming first)
      const events = (church.upcomingEvents || []).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      res.json({
        churchName: church.name,
        events,
        totalEvents: events.length
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({
        message: 'Failed to fetch events',
        error: 'Internal Server Error'
      });
    }
  }
);

/**
 * Create a new event
 * POST /api/dashboard/churches/:churchId/events
 * 
 * Request Body:
 * {
 *   title: string (required),
 *   description?: string,
 *   date: string/Date (required),
 *   time?: string,
 *   location?: string,
 *   image?: string,
 *   isRecurring?: boolean,
 *   recurringPattern?: 'weekly' | 'monthly' | 'yearly'
 * }
 */
router.post('/churches/:churchId/events',
  authMiddleware,
  checkChurchOwnership,
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const { title, description, date, time, location, image, isRecurring, recurringPattern } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: 'Event title is required',
          error: 'Bad Request'
        });
      }

      if (!date) {
        return res.status(400).json({
          message: 'Event date is required',
          error: 'Bad Request'
        });
      }

      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid date format',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      const newEvent = {
        title: title.trim(),
        description: description || '',
        date: eventDate,
        time: time || '',
        location: location || '',
        image: image || '',
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern || undefined,
        createdAt: new Date()
      };

      if (!church.upcomingEvents) {
        church.upcomingEvents = [];
      }

      church.upcomingEvents.push(newEvent);
      church.markModified('upcomingEvents');

      await church.save();

      res.status(201).json({
        message: 'Event created successfully',
        event: newEvent,
        totalEvents: church.upcomingEvents.length
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({
        message: 'Failed to create event',
        error: 'Internal Server Error'
      });
    }
  }
);

/**
 * Update an event
 * PATCH /api/dashboard/churches/:churchId/events/:eventIndex
 */
router.patch('/churches/:churchId/events/:eventIndex',
  authMiddleware,
  checkChurchOwnership,
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const eventIndex = parseInt(req.params.eventIndex);
      const { title, description, date, time, location, image, isRecurring, recurringPattern } = req.body;

      if (isNaN(eventIndex)) {
        return res.status(400).json({
          message: 'Invalid event index',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.upcomingEvents || eventIndex < 0 || eventIndex >= church.upcomingEvents.length) {
        return res.status(400).json({
          message: `Invalid event index. Valid range: 0-${(church.upcomingEvents?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      const event = church.upcomingEvents[eventIndex];

      // Update fields if provided
      if (title !== undefined) event.title = title.trim();
      if (description !== undefined) event.description = description;
      if (date !== undefined) {
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
          return res.status(400).json({
            message: 'Invalid date format',
            error: 'Bad Request'
          });
        }
        event.date = eventDate;
      }
      if (time !== undefined) event.time = time;
      if (location !== undefined) event.location = location;
      if (image !== undefined) event.image = image;
      if (isRecurring !== undefined) event.isRecurring = isRecurring;
      if (recurringPattern !== undefined) event.recurringPattern = recurringPattern;

      church.markModified('upcomingEvents');
      await church.save();

      res.json({
        message: 'Event updated successfully',
        event: church.upcomingEvents[eventIndex]
      });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({
        message: 'Failed to update event',
        error: 'Internal Server Error'
      });
    }
  }
);

/**
 * Delete an event
 * DELETE /api/dashboard/churches/:churchId/events/:eventIndex
 */
router.delete('/churches/:churchId/events/:eventIndex',
  authMiddleware,
  checkChurchOwnership,
  async (req, res) => {
    try {
      const churchId = req.params.churchId;
      const eventIndex = parseInt(req.params.eventIndex);

      if (isNaN(eventIndex)) {
        return res.status(400).json({
          message: 'Invalid event index',
          error: 'Bad Request'
        });
      }

      const church = await ChurchModel.findById(churchId);

      if (!church) {
        return res.status(404).json({
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      if (!church.upcomingEvents || eventIndex < 0 || eventIndex >= church.upcomingEvents.length) {
        return res.status(400).json({
          message: `Invalid event index. Valid range: 0-${(church.upcomingEvents?.length || 0) - 1}`,
          error: 'Bad Request'
        });
      }

      const deletedEvent = church.upcomingEvents[eventIndex];
      church.upcomingEvents.splice(eventIndex, 1);
      church.markModified('upcomingEvents');

      await church.save();

      res.json({
        message: 'Event deleted successfully',
        deletedEvent: deletedEvent.title,
        remainingEvents: church.upcomingEvents.length
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        message: 'Failed to delete event',
        error: 'Internal Server Error'
      });
    }
  }
);

// Cache church list for 5 minutes to reduce database load
router.get("/churches", authMiddleware, cacheMiddleware(300), dashboardController.getAllChurch);
// FRONTE END - SIGN UP ROUTE WITH NO AUTHENTICATION
// Use GET and the new controller for public church list
router.get("/public/churches", dashboardController.getPublicChurchList);
// Get single church with ownership information
router.get("/church/:id", authMiddleware, addOwnershipInfo, dashboardController.getChurch);

/**
 * Update Church Contact Information
 * PATCH /api/dashboard/churches/:id/contact
 * 
 * Purpose: Dedicated endpoint for updating church contact information
 * Supports both legacy fields and new structured contact object
 * 
 * Request Body (all fields optional):
 * {
 *   contact: {
 *     phoneNumber: string,
 *     email: string,
 *     website: string,
 *     facebook: string,
 *     twitter: string,
 *     instagram: string,
 *     youtube: string,
 *     whatsapp: string,
 *     telegram: string
 *   },
 *   address: {
 *     street: string,
 *     city: string,
 *     state: string,
 *     zipCode: string,
 *     country: string
 *   },
 *   description: string,
 *   denomination: string
 * }
 */
router.patch('/churches/:id/contact', 
  authMiddleware, 
  checkChurchOwnership, 
  invalidateCacheOnUpdate('/churches'),
  async (req: Request, res: Response) => {
    try {
      const churchId = req.params.id;
      const updateData: any = {};

      // Extract contact information
      if (req.body.contact) {
        updateData.contact = req.body.contact;
        
        // Also update legacy fields for backward compatibility
        if (req.body.contact.phoneNumber) updateData.phoneNumber = req.body.contact.phoneNumber;
        if (req.body.contact.email) updateData.email = req.body.contact.email;
        if (req.body.contact.website) updateData.website = req.body.contact.website;
      }

      // Extract address information
      if (req.body.address) {
        updateData.address = req.body.address;
        
        // Also update legacy fields
        if (req.body.address.city) updateData.city = req.body.address.city;
        if (req.body.address.state) updateData.state = req.body.address.state;
      }

      // Other contact-related fields
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.denomination !== undefined) updateData.denomination = req.body.denomination;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          message: 'No contact information provided to update',
          error: 'Bad Request'
        });
      }

      const updatedChurch = await ChurchModel.findByIdAndUpdate(
        churchId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedChurch) {
        return res.status(404).json({
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      res.json({
        message: 'Church contact information updated successfully',
        church: updatedChurch
      });
    } catch (error: any) {
      console.error('Error updating church contact:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          details: error.message,
          error: 'Bad Request'
        });
      }
      
      res.status(500).json({
        message: 'Failed to update church contact information',
        error: 'Internal Server Error'
      });
    }
  }
);

/**
 * Get Church Contact Information
 * GET /api/dashboard/churches/:id/contact
 * 
 * Purpose: Retrieve only contact-related information for a church
 * Useful for contact forms or displaying church contact details
 */
router.get('/churches/:id/contact',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const churchId = req.params.id;

      const church = await ChurchModel.findById(churchId)
        .select('name contact address phoneNumber email website city state denomination description')
        .lean();

      if (!church) {
        return res.status(404).json({
          message: 'Church not found',
          error: 'Not Found'
        });
      }

      // Return structured contact information
      const contactInfo = {
        churchName: church.name,
        contact: church.contact || {
          phoneNumber: church.phoneNumber,
          email: church.email,
          website: church.website
        },
        address: church.address || {
          city: church.city,
          state: church.state
        },
        denomination: church.denomination,
        description: church.description
      };

      res.json(contactInfo);
    } catch (error) {
      console.error('Error fetching church contact:', error);
      res.status(500).json({
        message: 'Failed to fetch church contact information',
        error: 'Internal Server Error'
      });
    }
  }
);

export default router;
