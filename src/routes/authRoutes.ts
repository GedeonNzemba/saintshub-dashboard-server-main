// src/routes/authRoutes.ts
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { UserDocument } from "../models/User";
import authMiddleware from "../middlewares/authMiddleware";
import userController from "../controllers/userController";
import { v4 as uuidv4 } from 'uuid';
import fileControllers from "../controllers/fileControllers";
import formidable from "formidable";
import path from "path";
import fileParser from "../middlewares/fileParser";
import cloudinary from "../utils/cloudinary";
import * as emailService from '../services/emailService';


interface MulterRequest extends Request {
  file: any;
}

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Input validation helper
const isValidLanguage = (lang: any): lang is 'en' | 'fr' => ['en', 'fr'].includes(lang);
const isValidRole = (role: any): role is 'pastor' | 'it' | 'user' => ['pastor', 'it', 'user'].includes(role);

// router.post("/create-note", (req, res) => {
//   res.send("<h1>Welcome to file upload</h1>");
// });

// ******************************************** FILE UPLOADER ************************************************

router.post("/upload-file", async (req, res) => {
  const form = formidable({
    uploadDir: path.join(__dirname, "public"),
    filename(name, ext, part) {
      const uniqueFileName = Date.now() + "_" + (part.originalFilename || name + ".jpg");
      return uniqueFileName;
    },
  });

  await form.parse(req);
  res.json({ ok: true });
});

router.post("/upload-file-to-cloud", fileParser, async (req, res) => {
  const { files } = req;
  const myFile = files?.profileImage;

  if (Array.isArray(myFile)) {
    // Multiple files upload
  } else {
    if (myFile) {
      try {
        const result = await cloudinary.uploader.upload(myFile.filepath, {
          resource_type: "image",
          public_id: "logo",
        });
        console.log("success", JSON.stringify(result.secure_url, null, 2));
        res.json({ result });
      } catch (error: any) {
        console.log("error", JSON.stringify(error, null, 2));
        res.json({ error });
        // res.status(error.http_code || 500).json({ error: error.message || 'Error uploading file to cloud' });
      }
    }
  }
});

// ******************************************** FILE UPLOADER ENDS ************************************************

// SIGN UP
router.post("/signup", async (req, res) => {
  try {
    const {
        name,
        surname,
        email,
        password,
        confirmPassword,
        avatar,
        language,
        role,
        selectedChurchId,
        otherChurchName
    } = req.body;

    if (!name || !surname || !email || !password || !confirmPassword || !avatar || !language || !role) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    if (!isValidLanguage(language)) {
        return res.status(400).json({ message: "Invalid language selected." });
    }
    if (!isValidRole(role)) {
        return res.status(400).json({ message: "Invalid role selected." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdminCandidate = role === 'pastor' || role === 'it';
    const churchSelection = selectedChurchId || otherChurchName;

    const newUser: UserDocument = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      admin: false,
      avatar: {
        public_id: uuidv4(),
        url: avatar,
      },
      language,
      isAdminCandidate,
      churchSelection,
    });

    await newUser.save();

    // --- Post-Save Actions (Emails) ---
    // Send welcome email (don't wait for it to finish, but catch errors)
    emailService.sendWelcomeEmail(newUser).catch((err: unknown) => {
        console.error(`Background task failed: Sending welcome email to ${newUser.email}`, err);
    });

    // Send admin notification if necessary (don't wait, catch errors)
    if (isAdminCandidate) {
      emailService.sendAdminNotificationEmail(newUser, role, churchSelection || 'N/A').catch((err: unknown) => {
          console.error(`Background task failed: Sending admin notification for ${newUser.email}`, err);
      });
    }

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const userResponse = {
        _id: newUser._id,
        name: newUser.name,
        surname: newUser.surname,
        email: newUser.email,
        avatar: newUser.avatar,
        language: newUser.language,
        admin: newUser.admin,
        isAdminCandidate: newUser.isAdminCandidate,
    };

    res.status(201).json({ token, user: userResponse });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "An unexpected error occurred during signup." });
  }
});

// SIGN IN
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid Email credentials." });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Password credentials." });
    } else {
      console.log("USER: ", user);
    }

    // Create and sign a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "5h",
    });

    // Set the JWT token as a cookie
    res.cookie("token", token, { httpOnly: true });

    res.status(200).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

// SIGN OUT
router.post("/signout", (req, res) => {
  res.clearCookie("token"); // Clear the JWT token cookie
  res.status(200).json({ message: "Sign-out successful." });
});

router.get("/user", authMiddleware, userController.getUser);
router.get('/user/logout', authMiddleware, userController.logoutUser); // New route for logout

router.put("/user/update-user", authMiddleware, userController.updateUser);
router.put("/user/update-avatar", authMiddleware, userController.updateUserImage);
router.put("/user/update-password", authMiddleware, userController.updatePassword);



router.get("/documents", authMiddleware, fileControllers.getDocuments);

export default router;
