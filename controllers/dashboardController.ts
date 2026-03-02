import { Request, Response } from "express";
import User, { UserDocument } from "../models/User";
import mongoose from "mongoose";
import { logoutMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcrypt";
import { ChurchModel } from "../models/Space";

interface AuthRequest extends Request {
    userId?: string;
    isChurchOwner?: boolean; // Added by addOwnershipInfo middleware
    body: {
      name: string;
      surname: string;
      email: string;
      password: string;
      confirmPassword: string;
      avatar: string;
      // Add other properties as needed
    };
  }

const getAllChurch = async (req: Request, res: Response) => {
    try {
        console.log('📋 GET ALL CHURCHES - Request received from:', req.headers['user-agent'] || 'unknown');
        const startTime = Date.now();
        
        const churches = await ChurchModel.find().lean(); // Use lean() for better performance
        
        console.log(`📦 DATABASE QUERY RESULT: Found ${churches?.length || 0} churches (type: ${typeof churches})`);
        
        // Validate data before sending
        const validChurches = churches.filter(church => 
            church && 
            church._id && 
            church.name && 
            church.location
        );
        
        if (validChurches.length !== churches.length) {
            console.warn(`⚠️ Filtered out ${churches.length - validChurches.length} invalid churches`);
        }
        
        const duration = Date.now() - startTime;
        console.log(`✅ GET ALL CHURCHES - Success: ${validChurches.length} valid churches found in ${duration}ms`);
        console.log(`📤 SENDING RESPONSE: ${JSON.stringify(validChurches).length} bytes`);
        
        res.json(validChurches);
    } catch (error) {
        console.error('❌ GET ALL CHURCHES - Error:', error);
        res.status(500).json({ 
            error: 'ERROR GETTING ALL CHURCHES',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const getChurch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const church = await ChurchModel.findById(id);
    if (!church) {
      return res.status(404).json({ error: "Church not found" });
    }
    
    console.log('📤 GET Church - principal.description:', church.principal?.description?.substring(0, 100));
    
    // Add ownership information to response
    const response = {
      ...church.toObject(),
      _permissions: {
        canEdit: req.isChurchOwner || false,
        message: req.isChurchOwner 
          ? "You can edit this church" 
          : "View only - This church belongs to another user"
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPublicChurchList = async (req: Request, res: Response) => {
    try {
        // Select only the _id and name fields
        const churches = await ChurchModel.find({}, '_id name');
        res.json(churches);
    } catch (error) {
        console.error('Error fetching public church list:', error);
        res.status(500).json({ error: 'Failed to fetch church list' });
    }
};

export default {getAllChurch, getChurch, getPublicChurchList};