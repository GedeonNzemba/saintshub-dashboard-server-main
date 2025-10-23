import { Request, Response } from "express";
import User, { UserDocument } from "../models/User";
import { ChurchModel } from "../models/Space";
import mongoose from "mongoose";
import { logoutMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcrypt";
import { addToBlacklist } from "../utils/tokenBlacklist";

interface AuthRequest extends Request {
  userId?: string;
  body: {
    name?: string;
    surname?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    currentPassword?: string;
    avatar?: {
      public_id: string;
      url: string;
    };
    // Add other properties as needed
  };
}

// Define a custom interface that extends the existing Request interface
interface CustomRequest extends Request {
  body: {
    // Define the properties you expect in the request body
    name: string;
    surname: string;
    email: string;
    // Add other properties as needed
  };
}

/**
 * Get Current User Profile
 * 
 * Purpose: Retrieve authenticated user's complete profile information
 * 
 * Response includes:
 * - Basic user information (name, email, avatar, etc.)
 * - List of churches created by this user
 * - churchSelection: The church they indicated during signup (for admin candidates)
 * 
 * Security: Password is excluded from response
 * 
 * Note: This endpoint returns churches where user._id matches the church.user._id
 */
const getUser = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch user from database
    const user = await User.findById(new mongoose.Types.ObjectId(req.userId))
      .select('-password'); // Exclude password for security

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Import ChurchModel to query churches
    const { ChurchModel } = require('../models/Space');

    // Find all churches created by this user
    // The church.user._id field stores the creator's user ID
    // NOTE: This query only returns churches that EXIST in database (deleted churches won't appear)
    const userChurches = await ChurchModel.find({ 
      'user._id': req.userId 
    })
    .select('_id name location logo createdAt') // Only return essential church fields
    .lean(); // Use lean() for better performance (returns plain JS objects)

    // Prepare user response with churches
    const userResponse = {
      ...user.toObject(),
      // Add churches array to response
      // If no churches found, returns empty array
      churches: userChurches || [],
      // churchSelection explanation
      _meta: {
        churchSelectionInfo: user.churchSelection 
          ? "This is the church the user indicated during signup (for admin verification)"
          : "No church selected during signup"
      }
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error while retrieving user information." });
  }
};

/**
 * Logout User
 * 
 * Purpose: Invalidate user's JWT token to prevent further use
 * 
 * Security Implementation:
 * - Extracts token from Authorization header
 * - Adds token to blacklist with expiration time
 * - Token becomes invalid immediately
 * - Client should also remove token from local storage
 * 
 * Note: Requires authMiddleware to be applied before this handler
 */
const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    // Import token blacklist utilities (now async with Redis)
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middlewares/authMiddleware');

    // Extract token from Authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ 
        success: false,
        message: "No token provided for logout" 
      });
    }

    const token = authHeader.substring(7).trim();

    // Decode token to get expiration time
    const decoded: any = jwt.decode(token);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + (24 * 60 * 60 * 1000); // Default 24h if no exp

    // Add token to blacklist (Redis-based, now async)
    await addToBlacklist(token, expiresAt);

    return res.status(200).json({ 
      success: true,
      message: "Successfully logged out. Token has been invalidated." 
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error during logout. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Update User Password
// Security: Requires current password verification before allowing password change
// This prevents unauthorized password changes if someone gains access to an authenticated session
const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    // Validate all required fields are provided
    if (!currentPassword || !password || !confirmPassword) {
      return res.status(400).json({ 
        message: "Please provide current password, new password, and confirmation.",
        required: ["currentPassword", "password", "confirmPassword"]
      });
    }

    // Validate new passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: "New password and confirmation do not match." 
      });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ 
        message: "New password must be at least 8 characters long." 
      });
    }

    // Fetch user from database
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // SECURITY: Verify current password before allowing change
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        message: "Current password is incorrect. Please try again." 
      });
    }

    // Check if new password is different from current password
    const isNewPasswordSameAsCurrent = await bcrypt.compare(password, user.password);
    if (isNewPasswordSameAsCurrent) {
      return res.status(400).json({ 
        message: "New password must be different from your current password." 
      });
    }

    // Hash the new password with bcrypt (salt rounds: 10)
    const hashedNewPassword = await bcrypt.hash(password, 10);

    // Update the user's password in database
    user.password = hashedNewPassword;
    await user.save();

    // Return success response (exclude password from response)
    const userResponse = {
      _id: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      avatar: user.avatar,
      language: user.language,
      admin: user.admin,
      isAdminCandidate: user.isAdminCandidate
    };

    res.status(200).json({
      message: 'Password has been updated successfully!', 
      user: userResponse
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error while updating password." });
  }
}

// Update User Info
// Note: Email updates are NOT allowed for security reasons.
// Users must contact support to change their email address.
const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, surname } = req.body;

    // Validate required fields
    if (!name || !surname) {
      return res.status(400).json({ 
        message: "Please provide both name and surname." 
      });
    }

    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update only name and surname (email is immutable for security)
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          name: name.trim(),
          surname: surname.trim(),
        },
      },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User information updated successfully.",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error while updating user information." });
  }
};

// Update User Avatar/Profile Image
// Requires both public_id and url to maintain data integrity
// The public_id is used for tracking and potential cleanup in cloud storage
const updateUserImage = async (req: AuthRequest, res: Response) => {
  try {
    const { avatar } = req.body;

    // Validate avatar object structure
    if (!avatar || typeof avatar !== 'object') {
      return res.status(400).json({ 
        message: "Please provide a valid avatar object." 
      });
    }

    // Ensure both public_id and url are provided
    if (!avatar.url || !avatar.public_id) {
      return res.status(400).json({ 
        message: "Avatar must include both 'url' and 'public_id' fields.",
        example: {
          avatar: {
            public_id: "unique-identifier",
            url: "https://example.com/image.jpg"
          }
        }
      });
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    if (!urlPattern.test(avatar.url)) {
      return res.status(400).json({ 
        message: "Please provide a valid image URL." 
      });
    }

    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update avatar with both public_id and url
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          avatar: {
            public_id: avatar.public_id.trim(),
            url: avatar.url.trim()
          }
        },
      },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Avatar updated successfully.",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user avatar:", error);
    res.status(500).json({ message: "Server error while updating avatar." });
  }
};

/**
 * Delete User Account
 * 
 * Purpose: Permanently delete user account and all associated data
 * 
 * Security Features:
 * - Requires password verification (ensures account owner is deleting)
 * - Invalidates current auth token immediately
 * - Cleans up associated churches (optional behavior)
 * 
 * Data Cleanup Options:
 * 1. Delete all churches created by user (current implementation)
 * 2. Or: Reassign churches to another admin (TODO: future enhancement)
 * 3. Or: Keep churches but remove user reference (orphaned churches)
 * 
 * Process Flow:
 * 1. Verify user exists
 * 2. Verify password is correct
 * 3. Delete associated churches (configurable)
 * 4. Delete user account
 * 5. Invalidate auth token
 * 
 * WARNING: This action is IRREVERSIBLE. All user data will be permanently deleted.
 * 
 * @param {string} password - User's current password (required for verification)
 * @returns 200 - Account deleted successfully
 * @returns 400 - Missing password or validation error
 * @returns 401 - Incorrect password
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
const deleteUserAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    // Validation: Password is required for account deletion
    if (!password) {
      return res.status(400).json({ 
        message: "Password is required to delete your account.",
        hint: "Please provide your current password to verify this action."
      });
    }

    // Step 1: Find the user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found.",
        hint: "Your session may be invalid. Please sign in again."
      });
    }

    // Step 2: Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Incorrect password.",
        hint: "Please enter your correct current password to delete your account."
      });
    }

    // Step 3: Delete all churches created by this user (configurable)
    // NOTE: Change deleteMany to updateMany if you want to keep churches but remove user reference
    const churchDeletionResult = await ChurchModel.deleteMany({ 'user._id': req.userId });
    console.log(`Deleted ${churchDeletionResult.deletedCount} churches for user ${req.userId}`);

    // Alternative: Keep churches but remove user reference (uncomment if preferred)
    // await ChurchModel.updateMany(
    //   { 'user._id': req.userId },
    //   { $set: { user: null } }
    // );

    // Step 4: Delete the user account
    await User.findByIdAndDelete(req.userId);

    // Step 5: Invalidate the auth token (Redis-based, now async)
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Token will expire in 1 hour (or whatever expiry was set)
      // Adding to blacklist immediately prevents any further use
      const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now
      await addToBlacklist(token, expiresAt);
    }

    res.status(200).json({ 
      message: "Account deleted successfully.",
      details: {
        userDeleted: true,
        churchesDeleted: churchDeletionResult.deletedCount,
        tokenInvalidated: true
      },
      info: "All your data has been permanently removed. We're sorry to see you go!"
    });

  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ 
      message: "Server error while deleting account.",
      hint: "Please try again later or contact support if the problem persists."
    });
  }
};

export default { getUser, logoutUser, updateUser, updatePassword, updateUserImage, deleteUserAccount };
