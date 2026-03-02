/**
 * Church Ownership Middleware
 * 
 * Purpose: Ensures that only the creator of a church can edit/delete it
 * 
 * How it works:
 * - Checks if the authenticated user's ID matches the church's user._id
 * - Allows operation if they match
 * - Returns 403 Forbidden if they don't match
 * 
 * Usage: Apply AFTER authMiddleware on update/delete routes
 * 
 * Example:
 * router.patch('/churches/:id', authMiddleware, checkChurchOwnership, updateHandler);
 */

import { Request, Response, NextFunction } from 'express';
import { ChurchModel } from '../models/Space';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to verify church ownership
 * Protects update and delete operations
 */
export const checkChurchOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const churchId = req.params.id || req.params.churchId;
    const userId = req.userId;

    // Validate church ID format
    if (!mongoose.Types.ObjectId.isValid(churchId)) {
      res.status(400).json({
        error: 'Invalid church ID',
        message: 'The provided church ID is not valid'
      });
      return;
    }

    // Find the church
    const church = await ChurchModel.findById(churchId).lean();

    if (!church) {
      res.status(404).json({
        error: 'Church not found',
        message: 'The requested church does not exist'
      });
      return;
    }

    // Check if the authenticated user is the church creator
    const isOwner = church.user._id.toString() === userId;

    // Also check if this church is the user's selected church (admin access)
    const User = require('../models/User').default;
    const user = await User.findById(userId).lean();
    const hasAdminAccess = user && user.churchSelection && user.churchSelection.toString() === churchId;

    // User can edit if they own the church OR if they have admin access to it
    const canEdit = isOwner || hasAdminAccess;

    console.log(`🔒 Ownership check for church ${churchId}:`, {
      userId,
      isOwner,
      hasAdminAccess,
      canEdit,
      userChurchSelection: user?.churchSelection?.toString()
    });

    if (!canEdit) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only edit churches that you created',
        details: 'This church belongs to another user'
      });
      return;
    }

    // User is the owner, proceed to next middleware/handler
    next();
  } catch (error) {
    console.error('Error in church ownership check:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify church ownership'
    });
  }
};

/**
 * Middleware to add ownership information to response
 * Use this for GET requests to inform frontend about edit permissions
 */
export const addOwnershipInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const churchId = req.params.id;
    const userId = req.userId;

    if (!churchId || !userId) {
      return next();
    }

    const church = await ChurchModel.findById(churchId).lean();

    if (church) {
      // Check if user owns the church OR has it as their selected church
      const isOwner = church.user._id.toString() === userId;
      
      // Also check if this church is the user's selected church (admin access)
      const User = require('../models/User').default;
      const user = await User.findById(userId).lean();
      const hasAdminAccess = user && user.churchSelection && user.churchSelection.toString() === churchId;
      
      // User can edit if they own the church OR if they have admin access to it
      (req as any).isChurchOwner = isOwner || hasAdminAccess;
      
      console.log(`🔒 Ownership check for church ${churchId}:`, {
        userId,
        isOwner,
        hasAdminAccess,
        canEdit: isOwner || hasAdminAccess,
        userChurchSelection: user?.churchSelection?.toString()
      });
    }

    next();
  } catch (error) {
    console.error('Error adding ownership info:', error);
    // Don't fail the request, just proceed without ownership info
    next();
  }
};

export default checkChurchOwnership;
