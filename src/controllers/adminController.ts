/**
 * Admin Management Controller
 * Handles admin approval requests and user role management
 */

import { Request, Response } from 'express';
import User from '../models/User';
import { sendAdminApprovedEmail } from '../services/emailService';

/**
 * Get all pending admin requests
 * Returns users with Pastor/IT roles who are not yet admins
 */
export const getPendingAdminRequests = async (req: Request, res: Response) => {
  try {
    const pendingUsers = await User.find({
      admin: false,
      role: { $in: ['Pastor', 'IT', 'Admin'] }
    })
    .select('name surname email role churchSelection createdAt')
    .sort({ createdAt: -1 });

    res.json({
      count: pendingUsers.length,
      requests: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending admin requests' });
  }
};

/**
 * Approve user for admin access
 * Sets admin: true and sends approval email
 */
export const approveAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.admin) {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    // Update admin status
    user.admin = true;
    await user.save();

    // Send approval email
    await sendAdminApprovedEmail(user.email, user.name, user.role || 'Admin');

    console.log(`✅ Admin access granted to ${user.email}`);

    res.json({
      message: 'Admin access granted successfully',
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        admin: user.admin
      }
    });
  } catch (error) {
    console.error('Error approving admin:', error);
    res.status(500).json({ error: 'Failed to approve admin access' });
  }
};

/**
 * Revoke admin access
 * Sets admin: false
 */
export const revokeAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.admin) {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    // Revoke admin status
    user.admin = false;
    await user.save();

    console.log(`⚠️ Admin access revoked from ${user.email}`);

    res.json({
      message: 'Admin access revoked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin
      }
    });
  } catch (error) {
    console.error('Error revoking admin:', error);
    res.status(500).json({ error: 'Failed to revoke admin access' });
  }
};

/**
 * Get all admins
 * Returns list of users with admin: true
 */
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await User.find({ admin: true })
      .select('name surname email role createdAt')
      .sort({ createdAt: -1 });

    res.json({
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};
