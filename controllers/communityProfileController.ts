/**
 * Community Profile Controller
 *
 * Handles CRUD operations for church community branding:
 * - Get community profile (public)
 * - Update community profile (owner/admin)
 *
 * Branding fields: coverImage, logo, tagline, description,
 * accentColor, website, welcomeMessage, guidelines
 */

import { Response } from "express";
import { ChurchModel } from "../models/Space";
import { ChurchMembershipModel } from "../models/ChurchMembership";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;

// ============================================================================
// HELPERS
// ============================================================================

const ALLOWED_FIELDS = [
  'coverImage',
  'logo',
  'tagline',
  'description',
  'accentColor',
  'website',
  'isPublic',
  'welcomeMessage',
  'guidelines',
];

/**
 * Check if the user is owner or admin of the church
 */
const isChurchAdmin = async (userId: string, churchId: string): Promise<boolean> => {
  const church = await ChurchModel.findById(churchId).select('user').lean();
  if (!church) return false;

  // Church creator/owner
  if (church.user?._id?.toString() === userId) return true;

  // Membership role check
  const membership = await ChurchMembershipModel.findOne({
    userId,
    churchId,
    role: { $in: ['owner', 'admin'] },
    isApproved: true,
  });

  return !!membership;
};

// ============================================================================
// GET COMMUNITY PROFILE
// ============================================================================

/**
 * GET /churches/:churchId/community-profile
 * Returns the community profile + basic church info for display.
 * Public endpoint — anyone can view.
 */
export const getCommunityProfile = async (req: Req, res: Response) => {
  try {
    const { churchId } = req.params;

    const church = await ChurchModel.findById(churchId)
      .select('name location image logo banner description communityProfile user contact address denomination')
      .lean();

    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    // Merge main church data with community profile for convenience
    const profile = {
      churchId: church._id,
      churchName: church.name,
      // Main church info (fallbacks)
      mainImage: church.image,
      mainLogo: church.logo,
      mainBanner: church.banner,
      location: church.location,
      denomination: church.denomination,
      churchDescription: church.description,
      address: church.address,
      contact: church.contact,
      ownerId: church.user?._id,
      // Community-specific branding (overrides)
      communityProfile: {
        coverImage: church.communityProfile?.coverImage || '',
        logo: church.communityProfile?.logo || '',
        tagline: church.communityProfile?.tagline || '',
        description: church.communityProfile?.description || '',
        accentColor: church.communityProfile?.accentColor || '#111111',
        website: church.communityProfile?.website || '',
        isPublic: church.communityProfile?.isPublic ?? true,
        welcomeMessage: church.communityProfile?.welcomeMessage || '',
        guidelines: church.communityProfile?.guidelines || '',
        updatedAt: church.communityProfile?.updatedAt || null,
      },
    };

    return res.status(200).json(profile);
  } catch (error: any) {
    console.error('Error fetching community profile:', error);
    return res.status(500).json({ message: 'Failed to fetch community profile', error: error.message });
  }
};

// ============================================================================
// UPDATE COMMUNITY PROFILE
// ============================================================================

/**
 * PATCH /churches/:churchId/community-profile
 * Update community branding fields. Owner/admin only.
 */
export const updateCommunityProfile = async (req: Req, res: Response) => {
  try {
    const { churchId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Authorization check
    const authorized = await isChurchAdmin(userId, churchId);
    if (!authorized) {
      return res.status(403).json({ message: 'Only church owners and admins can update the community profile' });
    }

    // Filter to allowed fields only
    const updates: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) {
        updates[`communityProfile.${key}`] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    // Always stamp the update time
    updates['communityProfile.updatedAt'] = new Date();

    // Validate specific fields
    // Tagline stays plain text with a strict limit
    if (req.body.tagline && req.body.tagline.length > 160) {
      return res.status(400).json({ message: 'Tagline must be 160 characters or less' });
    }
    // Description, welcomeMessage, and guidelines support rich text (HTML),
    // so we allow generous limits to accommodate markup + embedded images.
    if (req.body.description && req.body.description.length > 50000) {
      return res.status(400).json({ message: 'Description content is too long' });
    }
    if (req.body.welcomeMessage && req.body.welcomeMessage.length > 50000) {
      return res.status(400).json({ message: 'Welcome message content is too long' });
    }
    if (req.body.guidelines && req.body.guidelines.length > 50000) {
      return res.status(400).json({ message: 'Guidelines content is too long' });
    }
    if (req.body.accentColor && !/^#[0-9a-fA-F]{6}$/.test(req.body.accentColor)) {
      return res.status(400).json({ message: 'Accent color must be a valid hex color (e.g., #FF5733)' });
    }

    const updated = await ChurchModel.findByIdAndUpdate(
      churchId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('name communityProfile logo image');

    if (!updated) {
      return res.status(404).json({ message: 'Church not found' });
    }

    return res.status(200).json({
      message: 'Community profile updated successfully',
      communityProfile: updated.communityProfile,
    });
  } catch (error: any) {
    console.error('Error updating community profile:', error);
    return res.status(500).json({ message: 'Failed to update community profile', error: error.message });
  }
};
