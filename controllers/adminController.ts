/**
 * Admin Management Controller
 * Handles admin approval requests and user role management
 */

import { Request, Response } from 'express';
import User from '../models/User';
import { sendAdminApprovedEmail, sendStoragePlanUpdatedEmail, sendStorageUpgradeRejectedEmail, sendAdminReplyEmail } from '../services/emailService';

const VALID_PLANS = ['free', 'basic', 'pro', 'unlimited'] as const;
type StoragePlan = typeof VALID_PLANS[number];

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

/**
 * Update a user's storage plan
 * Admin-only endpoint to change storagePlan field
 */
export const updateUserPlan = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!plan || !VALID_PLANS.includes(plan as StoragePlan)) {
      return res.status(400).json({ 
        error: 'Invalid plan. Must be one of: free, basic, pro, unlimited' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldPlan = user.storagePlan || 'free';

    if (oldPlan === plan) {
      return res.status(400).json({ error: `User is already on the ${plan} plan` });
    }

    // Update the plan and clear any pending upgrade request
    user.storagePlan = plan as StoragePlan;
    user.pendingUpgradeRequest = undefined as any;
    // Store the result so the mobile app can notify the user
    user.upgradeRequestResult = {
      status: 'approved',
      previousPlan: oldPlan,
      newPlan: plan,
      requestedPlan: plan,
      resolvedAt: new Date(),
    };
    await user.save();
    // Ensure the pending field is fully removed from the document
    await User.updateOne({ _id: user._id }, { $unset: { pendingUpgradeRequest: 1 } });

    // Send confirmation email to user
    await sendStoragePlanUpdatedEmail(user.email, user.name, oldPlan, plan);

    console.log(`✅ Storage plan updated for ${user.email}: ${oldPlan} → ${plan}`);

    res.json({
      message: 'Storage plan updated successfully',
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        storagePlan: user.storagePlan,
        previousPlan: oldPlan
      }
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ error: 'Failed to update storage plan' });
  }
};

/**
 * Get all pending storage upgrade requests
 */
export const getPendingUpgradeRequests = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({
      'pendingUpgradeRequest.requestedPlan': { $exists: true },
    })
      .select('name surname email storagePlan pendingUpgradeRequest avatar createdAt')
      .sort({ 'pendingUpgradeRequest.requestedAt': -1 })
      .lean();

    res.json({
      count: users.length,
      requests: users.map((u: any) => ({
        userId: u._id,
        name: `${u.name || ''} ${u.surname || ''}`.trim(),
        email: u.email,
        avatar: u.avatar?.url || null,
        currentPlan: u.storagePlan || 'free',
        requestedPlan: u.pendingUpgradeRequest?.requestedPlan,
        reason: u.pendingUpgradeRequest?.reason || '',
        requestedAt: u.pendingUpgradeRequest?.requestedAt,
        memberSince: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching upgrade requests:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade requests' });
  }
};

/**
 * Reject a pending upgrade request (clears it without changing plan)
 */
export const rejectUpgradeRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.pendingUpgradeRequest?.requestedPlan) {
      return res.status(400).json({ error: 'User has no pending upgrade request' });
    }

    const rejected = { ...(user.pendingUpgradeRequest as any) };
    const currentPlan = user.storagePlan || 'free';
    const requestedPlan = user.pendingUpgradeRequest?.requestedPlan || 'unknown';

    // Clear the pending request and store the result for in-app notification
    user.pendingUpgradeRequest = undefined as any;
    user.upgradeRequestResult = {
      status: 'rejected',
      previousPlan: currentPlan,
      newPlan: currentPlan, // plan doesn't change on rejection
      requestedPlan,
      resolvedAt: new Date(),
    };
    await user.save();
    await User.updateOne({ _id: user._id }, { $unset: { pendingUpgradeRequest: 1 } });

    // Notify the user via email
    const userName = `${user.name || ''} ${user.surname || ''}`.trim() || 'User';
    await sendStorageUpgradeRejectedEmail(user.email, userName, currentPlan, requestedPlan);

    console.log(`⚠️ Upgrade request rejected for ${user.email}`);

    res.json({
      message: 'Upgrade request rejected',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        storagePlan: user.storagePlan || 'free',
      },
      rejectedRequest: rejected,
    });
  } catch (error) {
    console.error('Error rejecting upgrade request:', error);
    res.status(500).json({ error: 'Failed to reject upgrade request' });
  }
};

/**
 * Send a custom email to a user from the admin dashboard
 */
export const sendEmailToUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { subject, message } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const user = await User.findById(userId).select('name surname email').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userName = `${user.name || ''} ${user.surname || ''}`.trim();
    await sendAdminReplyEmail(user.email, userName, subject, message);

    console.log(`✅ Admin email sent to ${user.email}: "${subject}"`);

    res.json({
      message: 'Email sent successfully',
      to: user.email,
      subject,
    });
  } catch (error) {
    console.error('Error sending email to user:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
