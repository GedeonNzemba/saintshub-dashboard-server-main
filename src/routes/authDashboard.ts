import express, { Request, Response } from "express";
import { ChurchDoc, ChurchModel } from "../models/Space";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";
import dashboardController from "../controllers/dashboardController";
import User from "../models/User";
import { validateCreateChurch, validateUpdateChurch } from "../middlewares/validators";
import { cacheMiddleware, invalidateCacheOnUpdate } from "../middlewares/cacheMiddleware";

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
    const { name, principal, location, image, banner, securities, oldServices, liveServices, gallery, songs, logo } = req.body;

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
      // AUTO-POPULATE: User info from authenticated session
      user: {
        name: user.name,
        email: user.email,
        _id: user._id.toString(),
        image: user.avatar?.url || ""
      }
    };

    // Create church in database
    const newChurch = await ChurchModel.create(churchData);

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
router.patch("/churches/:id/:field", async (req, res) => {
  try {
    const { id, field }: ChurchParams = req.params;
    const updateData = { [field]: req.body[field] };
    
    // Validate that the field exists in the request body
    if (req.body[field] === undefined) {
      return res.status(400).json({ 
        message: `Missing value for field '${field}'`,
        error: "Bad Request"
      });
    }
    
    const updatedChurch = await ChurchModel.findByIdAndUpdate(id, updateData, { new: true });
    
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
// Invalidates church cache on successful update
router.patch('/churches/:id', validateUpdateChurch, invalidateCacheOnUpdate('/churches'), async (req: Request, res: Response) => {
  const churchId = req.params.id;
  const updatedData = req.body;

  try {
    if (!updatedData || Object.keys(updatedData).length === 0) {
      return res.status(400).json({ 
        message: "No data provided for update",
        error: "Bad Request"
      });
    }

    const updatedChurch = await ChurchModel.findByIdAndUpdate(
      churchId, 
      updatedData, 
      { new: true, runValidators: true }
    );

    if (!updatedChurch) {
      return res.status(404).json({ 
        message: "Church not found",
        error: "Not Found"
      });
    }

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
router.delete('/church/:id', async (req, res) => {
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
router.delete('/churches/:churchId/gallery/:imageIndex', async (req, res) => {
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
router.delete('/churches/:churchId/banner/:imageIndex', async (req, res) => {
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
router.delete('/churches/:churchId/past-service/:serviceIndex', async (req, res) => {
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


router.delete('/churches/:churchId/deacon/:deaconIndex', async (req, res) => {
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

router.delete('/churches/:churchId/trustee/:trusteeIndex', async (req, res) => {
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
router.delete('/churches/:churchId/song/:songIndex', async (req, res) => {
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
router.delete('/churches/:churchId/live/:liveIndex', async (req, res) => {
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

// Cache church list for 5 minutes to reduce database load
router.get("/churches", authMiddleware, cacheMiddleware(300), dashboardController.getAllChurch);
// FRONTE END - SIGN UP ROUTE WITH NO AUTHENTICATION
// Use GET and the new controller for public church list
router.get("/public/churches", dashboardController.getPublicChurchList);
router.get("/church/:id", authMiddleware, dashboardController.getChurch);



export default router;
