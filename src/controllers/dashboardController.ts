import { Request, Response } from "express";
import User, { UserDocument } from "../models/User";
import mongoose from "mongoose";
import { logoutMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcrypt";
import { ChurchModel } from "../models/Space";

interface AuthRequest extends Request {
    userId?: string;
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
        const churches = await ChurchModel.find();
        res.json(churches);
    } catch (error) {
        res.status(500).json({ error: 'ERROR GETTING ALL CHURCHES' });
    }
};

const getChurch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const church = await ChurchModel.findById(id);
    if (!church) {
      return res.status(404).json({ error: "Church not found" });
    }
    res.json(church);
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