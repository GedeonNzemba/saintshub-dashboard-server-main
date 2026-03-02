/**
 * Admin Management Routes
 * Requires admin authentication
 */

import express from 'express';
import {
  getPendingAdminRequests,
  approveAdmin,
  revokeAdmin,
  getAllAdmins,
  updateUserPlan,
  getPendingUpgradeRequests,
  rejectUpgradeRequest,
  sendEmailToUser
} from '../controllers/adminController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication and admin access
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all pending admin requests
router.get('/pending-requests', getPendingAdminRequests);

// Get all current admins
router.get('/all-admins', getAllAdmins);

// Approve user for admin access
router.put('/approve/:userId', approveAdmin);

// Revoke admin access
router.put('/revoke/:userId', revokeAdmin);

// Update a user's storage plan (e.g. free → basic → pro → unlimited)
router.put('/users/:userId/plan', updateUserPlan);

// Get all pending storage upgrade requests
router.get('/upgrade-requests', getPendingUpgradeRequests);

// Reject a pending upgrade request (clears it without changing plan)
router.put('/users/:userId/reject-upgrade', rejectUpgradeRequest);

// Send a custom email to a user from the admin dashboard
router.post('/users/:userId/send-email', sendEmailToUser);

export default router;
