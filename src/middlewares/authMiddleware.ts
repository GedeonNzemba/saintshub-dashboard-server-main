// src/middlewares/authMiddleware.ts
/**
 * Authentication Middleware
 * 
 * Purpose: Verify JWT tokens and protect routes from unauthorized access
 * 
 * Features:
 * - Validates JWT token from Authorization header
 * - Checks if token is blacklisted (after logout)
 * - Extracts user ID and attaches to request object
 * - Provides clear error messages for debugging
 * 
 * Security: Uses token blacklist to invalidate tokens after logout
 */
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { isBlacklisted } from "../utils/tokenBlacklist";

interface DecodedToken {
  userId: string;
  exp?: number; // Token expiration timestamp
}

// TODO: Move to environment variable for production security
export const JWT_SECRET = process.env.JWT_SECRET ||
  "8b4061ff56160f352be1233f6138b39824a026de71dc75cfd347e7f9b33450be9a9f0d7d865ab903177879ae8629e7458d7a405195149a0c0b5f22a95d0852d1";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ 
        message: "Access denied. No token provided.",
        hint: "Please include 'Authorization: Bearer <token>' header"
      });
    }

    // SECURITY: Check if token has been blacklisted (user logged out)
    // Now using Redis-based blacklist (async operation)
    const tokenIsBlacklisted = await isBlacklisted(token);
    if (tokenIsBlacklisted) {
      return res.status(401).json({ 
        message: "Token has been invalidated. Please log in again.",
        reason: "logout"
      });
    }

    // Verify and decode the JWT token
    const decodedToken = verifyToken(token);

    if (!decodedToken || typeof decodedToken === 'string') {
      // Provide specific error message for expired vs invalid tokens
      const message = decodedToken === "Token expired" 
        ? "Your session has expired. Please log in again."
        : "Invalid or expired token. Please log in again.";
      
      return res.status(401).json({ 
        message,
        hint: "Please sign in again to continue"
      });
    }

    // Attach user ID to request for downstream use
    setUserIdOnRequest(req, decodedToken.userId);
    
    // Token is valid, proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication service error." });
  }
};

/**
 * Extract JWT token from Authorization header
 * Expected format: "Bearer <token>"
 */
const getTokenFromRequest = (req: Request): string | null => {
  const authorizationHeader = req.header("Authorization");
  
  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
    // Extract token after "Bearer " prefix
    return authorizationHeader.substring(7).trim();
  }
  
  return null;
};

/**
 * Verify JWT token signature and expiration
 * @returns DecodedToken if valid, string error message if invalid
 */
const verifyToken = (token: string): DecodedToken | string => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error: any) {
    // Log specific error for debugging
    if (error.name === 'TokenExpiredError') {
      console.error("Token has expired:", error.message);
      return "Token expired";
    } else if (error.name === 'JsonWebTokenError') {
      console.error("Invalid token:", error.message);
      return "Invalid token";
    }
    
    console.error("Token verification failed:", error);
    return "Token verification failed";
  }
};

/**
 * Attach authenticated user ID to request object
 * This makes userId available to all downstream route handlers
 */
const setUserIdOnRequest = (req: Request, userId: string): void => {
  (req as any).userId = userId;
};

// ******************************** SIGN OUT MIDDLEWARE ********************************

/**
 * Logout Middleware (Alternative logout endpoint)
 * 
 * This middleware invalidates the user's token by adding it to the blacklist
 * Can be used as an alternative to the /api/user/logout route
 */
export const logoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      // Import blacklist utility
      const { addToBlacklist } = require('../utils/tokenBlacklist');
      
      // Decode token to get expiration
      const decoded: any = jwt.decode(token);
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + (24 * 60 * 60 * 1000);
      
      // Add to blacklist
      addToBlacklist(token, expiresAt);
    }

    // Clear user ID from request
    clearUserIdOnRequest(req);

    res.status(200).json({ 
      message: "Logout successful. Token has been invalidated." 
    });
  } catch (error) {
    console.error("Logout middleware error:", error);
    res.status(500).json({ message: "Server error during logout." });
  }
};

/**
 * Clear user ID from request object
 */
const clearUserIdOnRequest = (req: Request): void => {
  delete (req as any).userId;
};

// ******************************** SIGN OUT ENDS ********************************

/**
 * Admin Middleware
 * Requires authentication first (use after authMiddleware)
 * Checks if user has admin privileges
 */
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Import User model here to avoid circular dependency
    const User = (await import('../models/User')).default;
    
    const user = await User.findById(userId).select('admin');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.admin) {
      return res.status(403).json({ error: 'Admin access required. You do not have permission to perform this action.' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

export default authMiddleware;
export { authMiddleware };
