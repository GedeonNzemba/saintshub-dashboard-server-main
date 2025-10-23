/**
 * Admin Management Routes
 * Requires admin authentication
 */

import express from 'express';
import {
  getPendingAdminRequests,
  approveAdmin,
  revokeAdmin,
  getAllAdmins
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

export default router;
