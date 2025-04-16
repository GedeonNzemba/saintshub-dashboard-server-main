import express, { Request, Response } from "express";
import { ChurchDoc, ChurchModel } from "../models/Space";
import authMiddleware from "../middlewares/authMiddleware";
import dashboardController from "../controllers/dashboardController";

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

// Create a new church
router.post("/create-church", async (req: AuthRequest, res: Response) => {
  try {
    const churchData = req.body;
    const newChurch = await ChurchModel.create(churchData);
    res.status(201).json(newChurch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a specific field in the church document
router.patch("/churches/:id/:field", async (req, res) => {
  try {
    console.log("ROUTE 1: ", req)

    const { id, field }: ChurchParams = req.params;
    const updateData = { [field]: req.body[field] };
    const updatedChurch = await ChurchModel.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedChurch);
  } catch (error) {
    console.error('error: ', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch('/churches/:id', async (req, res) => {
  const churchId = req.params.id;
  const updatedData = req.body;

  try {
    console.log("ROUTE 2")
      const updatedChurch = await ChurchModel.findByIdAndUpdate(churchId, updatedData, { new: true });
      res.json(updatedChurch);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update church" });
  }
});

// DELETE CHURCH
router.delete('/church/:id', async (req, res) => {
  try {
    const churchId = req.params.id;

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    await ChurchModel.findByIdAndDelete(churchId);

    res.json({ message: 'Church deleted successfully' });
  } catch (error) {
    console.error('Error removing church:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define a route to handle image deletion
router.delete('/churches/:churchId/gallery/:imageIndex', async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const imageIndex = parseInt(req.params.imageIndex);

    // Check if imageIndex is a valid number
    if (isNaN(imageIndex)) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    // Find the church by ID
    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Check if imageIndex is within the valid range
    if (imageIndex < 0 || imageIndex >= church.gallery.length) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    // Remove the image from the gallery array
    church.gallery.splice(imageIndex, 1); // Assuming gallery is an array field in your Church model

    // Save the updated church document
    await church.save();

    // Send a success response
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error removing gallery image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define a route to handle image deletion
router.delete('/churches/:churchId/banner/:imageIndex', async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const imageIndex = parseInt(req.params.imageIndex);

    // Check if imageIndex is a valid number
    if (isNaN(imageIndex)) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    // Find the church by ID
    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    // Check if imageIndex is within the valid range
    if (imageIndex < 0 || imageIndex >= church.gallery.length) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    // Remove the image from the gallery array
    church.banner.splice(imageIndex, 1); // Assuming gallery is an array field in your Church model

    // Save the updated church document
    await church.save();

    // Send a success response
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error removing gallery image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/churches/:churchId/past-service/:serviceIndex', async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const serviceIndex = parseInt(req.params.serviceIndex);

    if (isNaN(serviceIndex)) {
      return res.status(400).json({ error: 'Invalid service index' });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    if (serviceIndex < 0 || serviceIndex >= church.oldServices.length) {
      return res.status(400).json({ error: 'Invalid servirce index' });
    }

    church.oldServices.splice(serviceIndex, 1);

    await church.save();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error removing past servirce:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/churches/:churchId/deacon/:deaconIndex', async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const deaconIndex = parseInt(req.params.deaconIndex);

    if (isNaN(deaconIndex)) {
      return res.status(400).json({ error: 'Invalid deacon index' });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    if (deaconIndex < 0 || deaconIndex >= church.securities.deacons.length) {
      return res.status(400).json({ error: 'Invalid deacon index' });
    }

    church.securities.deacons.splice(deaconIndex, 1);

    await church.save();

    res.json({ message: 'deacon deleted successfully' });
  } catch (error) {
    console.error('Error removing deacon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/churches/:churchId/trustee/:trusteeIndex', async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const trusteeIndex = parseInt(req.params.trusteeIndex);

    if (isNaN(trusteeIndex)) {
      return res.status(400).json({ error: 'Invalid trustee index' });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    if (trusteeIndex < 0 || trusteeIndex >= church.securities.trustees.length) {
      return res.status(400).json({ error: 'Invalid trustee index' });
    }

    church.securities.trustees.splice(trusteeIndex, 1);

    await church.save();

    res.json({ message: 'trustee deleted successfully' });
  } catch (error) {
    console.error('Error removing trustee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/churches/:churchId/song/:songIndex', async (req, res) => {
  try {
    const churchId = req.params.churchId;
    const songIndex = parseInt(req.params.songIndex);

    if (isNaN(songIndex)) {
      return res.status(400).json({ error: 'Invalid song index' });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    if (songIndex < 0 || songIndex >= church.songs.length) {
      return res.status(400).json({ error: 'Invalid song index' });
    }

    church.songs.splice(songIndex, 1);

    await church.save();

    res.json({ message: 'song deleted successfully' });
  } catch (error) {
    console.error('Error removing song:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/churches/:churchId/live/:liveIndex', async (req, res) => {
  try {
    console.log("LIVE INDEX")
    const churchId = req.params.churchId;
    const liveIndex = parseInt(req.params.liveIndex);

    if (isNaN(liveIndex)) {
      return res.status(400).json({ error: 'Invalid song index' });
    }

    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }

    if (liveIndex < 0 || liveIndex >= church.liveServices.length) {
      return res.status(400).json({ error: 'Invalid song index' });
    }

    church.liveServices.splice(liveIndex, 1);

    await church.save();

    res.json({ message: 'Live Service deleted successfully' });
  } catch (error) {
    console.error('Error removing live service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/churches", authMiddleware, dashboardController.getAllChurch);
// FRONTE END - SIGN UP ROUTE WITH NO AUTHENTICATION
// Use GET and the new controller for public church list
router.get("/public/churches", dashboardController.getPublicChurchList);
router.get("/church/:id", authMiddleware, dashboardController.getChurch);



export default router;
