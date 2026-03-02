// src/middlewares/adminMiddleware.ts
/**
 * Admin Authorization Middleware
 * 
 * Purpose: Restrict access to routes that require admin or admin candidate privileges
 * 
 * Use Cases:
 * - Creating/managing church profiles
 * - Accessing administrative dashboards
 * - Managing system-wide content
 * 
 * User Types with Access:
 * - admin: true (ONLY verified administrators can pass)
 * - isAdminCandidate: true (pending verification - DENIED access until admin approves)
 * 
 * Must be used AFTER authMiddleware to ensure userId is available
 */

import { Request, Response, NextFunction } from "express";
import User from "../models/User";

interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to verify user has admin or admin candidate privileges
 * 
 * @param req - Express request object (must have userId from authMiddleware)
 * @param res - Express response object
 * @param next - Express next function
 */
const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Ensure userId exists (should be set by authMiddleware)
    if (!req.userId) {
      return res.status(401).json({ 
        message: "Authentication required. Please log in first.",
        hint: "This endpoint requires authMiddleware to run first"
      });
    }

    // Fetch user from database to check privileges
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        message: "User not found. Please log in again." 
      });
    }

    // Check if user has admin privileges
    // IMPORTANT: Only users with admin: true can create churches
    // isAdminCandidate users (pastors/IT staff) must be verified by system admin first
    const hasAdminAccess = user.admin === true;

    if (!hasAdminAccess) {
      return res.status(403).json({ 
        message: "Access denied. This action requires verified administrator privileges.",
        hint: user.isAdminCandidate 
          ? "Your admin request is pending. Please wait for verification by a system administrator."
          : "Only verified administrators can perform this action. Contact support if you need admin access.",
        userRole: {
          isAdmin: user.admin,
          isAdminCandidate: user.isAdminCandidate
        }
      });
    }

    // User has required privileges, proceed to route handler
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ 
      message: "Error verifying administrative privileges." 
    });
  }
};

export default adminMiddleware;
