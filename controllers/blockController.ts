import { Request, Response } from "express";
import { ChurchModel } from "../models/Space";
import mongoose from "mongoose";
import logger from "../utils/logger";

/** Whitelist of valid block types — reject anything not in this set */
const VALID_BLOCK_TYPES = new Set([
  'hero-banner', 'leadership', 'section-grid', 'gallery', 'video-gallery',
  'services', 'events', 'songs', 'rich-text', 'contact', 'social-feed',
  'giving', 'custom-embed', 'container',
  'divider', 'spacer', 'heading', 'cta-button', 'badge-row', 'quote',
  'countdown', 'announcement-bar', 'social-links', 'map', 'stats-row',
  'testimonial', 'accordion',
]);

interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Validate a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * Strip dangerous HTML tags and attributes from rich-text content.
 * Removes <script>, <iframe>, <object>, <embed>, <form>,
 * and on* event handler attributes from any tag.
 */
const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return html;
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
};

/**
 * Recursively sanitize HTML strings in block configs
 */
const sanitizeBlockConfig = (config: any): any => {
  if (!config || typeof config !== 'object') return config;

  // Preserve arrays — recurse into each element without destroying the array
  if (Array.isArray(config)) {
    return config.map((item: any) => sanitizeBlockConfig(item));
  }

  const sanitized = { ...config };
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string' && (key === 'html' || key === 'content' || key === 'body' || key === 'text' || key === 'description' || key === 'subtitle' || key === 'bio')) {
      sanitized[key] = sanitizeHtml(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => sanitizeBlockConfig(item));
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeBlockConfig(sanitized[key]);
    }
  }
  return sanitized;
};

// ============================================================================
// PAGE BLOCKS CRUD
// ============================================================================

/**
 * GET /churches/:churchId/blocks
 * Get all page blocks for a church
 */
export const getBlocks = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const church = await ChurchModel.findById(churchId).select('pageBlocks theme');

    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    return res.status(200).json({
      pageBlocks: church.pageBlocks || [],
      theme: church.theme || {},
    });
  } catch (error: any) {
    logger.error('Error fetching blocks', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch blocks', error: error.message });
  }
};

/**
 * PUT /churches/:churchId/blocks
 * Replace all page blocks (full save)
 */
export const saveBlocks = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    if (!isValidObjectId(churchId)) {
      return res.status(400).json({ message: 'Invalid church ID' });
    }

    const { pageBlocks } = req.body;

    if (!Array.isArray(pageBlocks)) {
      return res.status(400).json({ message: 'pageBlocks must be an array' });
    }

    if (pageBlocks.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 blocks per page' });
    }

    // Validate block types against whitelist
    const invalidTypes = pageBlocks
      .filter((b: any) => b.type && !VALID_BLOCK_TYPES.has(b.type))
      .map((b: any) => b.type);
    if (invalidTypes.length > 0) {
      return res.status(400).json({ message: `Invalid block type(s): ${invalidTypes.join(', ')}` });
    }

    // Validate, sanitize, and assign _id to blocks that don't have one
    const processedBlocks = pageBlocks.map((block: any, index: number) => ({
      ...block,
      _id: block._id || block.id || new mongoose.Types.ObjectId().toString(),
      order: block.order ?? index,
      visible: block.visible ?? block.isVisible ?? true,
      config: sanitizeBlockConfig(block.config || {}),
      style: block.style || {},
      children: (block.children || []).map((child: any, childIndex: number) => ({
        ...child,
        _id: child._id || child.id || new mongoose.Types.ObjectId().toString(),
        order: child.order ?? childIndex,
        visible: child.visible ?? child.isVisible ?? true,
        config: sanitizeBlockConfig(child.config || {}),
        style: child.style || {},
      })),
      updatedAt: new Date(),
    }));

    const church = await ChurchModel.findByIdAndUpdate(
      churchId,
      { $set: { pageBlocks: processedBlocks } },
      { new: true, runValidators: true }
    ).select('pageBlocks');

    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    return res.status(200).json({
      message: 'Blocks saved successfully',
      pageBlocks: church.pageBlocks,
    });
  } catch (error: any) {
    logger.error('Error saving blocks', { error: error.message });
    return res.status(500).json({ message: 'Failed to save blocks', error: error.message });
  }
};

/**
 * POST /churches/:churchId/blocks
 * Add a new block to the page
 */
export const addBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const { type, config, style, order, children } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Block type is required' });
    }

    if (!VALID_BLOCK_TYPES.has(type)) {
      return res.status(400).json({ message: `Invalid block type: ${type}` });
    }

    if (!isValidObjectId(churchId)) {
      return res.status(400).json({ message: 'Invalid church ID' });
    }

    const church = await ChurchModel.findById(churchId);
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const newBlock = {
      _id: new mongoose.Types.ObjectId(),
      type,
      order: order ?? (church.pageBlocks?.length || 0),
      visible: true,
      config: sanitizeBlockConfig(config || {}),
      style: style || {},
      children: (children || []).map((child: any, index: number) => ({
        ...child,
        _id: child._id || new mongoose.Types.ObjectId(),
        order: child.order ?? index,
        visible: child.visible ?? true,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!church.pageBlocks) {
      church.pageBlocks = [];
    }
    (church.pageBlocks as any[]).push(newBlock);
    await church.save();

    return res.status(201).json({
      message: 'Block added successfully',
      block: newBlock,
    });
  } catch (error: any) {
    logger.error('Error adding block', { error: error.message });
    return res.status(500).json({ message: 'Failed to add block', error: error.message });
  }
};

/**
 * PATCH /churches/:churchId/blocks/:blockId
 * Update a specific block
 */
export const updateBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId, blockId } = req.params;

    if (!isValidObjectId(churchId) || !isValidObjectId(blockId)) {
      return res.status(400).json({ message: 'Invalid church or block ID' });
    }

    const updates = req.body;

    const church = await ChurchModel.findById(churchId);
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const blocks = church.pageBlocks as any[] || [];
    let blockFound = false;

    // Search top-level blocks
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i]._id?.toString() === blockId) {
        // Merge updates into the block (sanitize config HTML)
        if (updates.config) blocks[i].config = { ...blocks[i].config, ...sanitizeBlockConfig(updates.config) };
        if (updates.style) blocks[i].style = { ...blocks[i].style, ...updates.style };
        if (updates.visible !== undefined) blocks[i].visible = updates.visible;
        if (updates.order !== undefined) blocks[i].order = updates.order;
        if (updates.children) blocks[i].children = updates.children;
        blocks[i].updatedAt = new Date();
        blockFound = true;
        break;
      }

      // Search in children (container blocks)
      if (blocks[i].children && blocks[i].children.length > 0) {
        for (let j = 0; j < blocks[i].children.length; j++) {
          if (blocks[i].children[j]._id?.toString() === blockId) {
            if (updates.config) blocks[i].children[j].config = { ...blocks[i].children[j].config, ...sanitizeBlockConfig(updates.config) };
            if (updates.style) blocks[i].children[j].style = { ...blocks[i].children[j].style, ...updates.style };
            if (updates.visible !== undefined) blocks[i].children[j].visible = updates.visible;
            if (updates.order !== undefined) blocks[i].children[j].order = updates.order;
            blocks[i].children[j].updatedAt = new Date();
            blockFound = true;
            break;
          }
        }
      }
      if (blockFound) break;
    }

    if (!blockFound) {
      return res.status(404).json({ message: 'Block not found' });
    }

    church.markModified('pageBlocks');
    await church.save();

    return res.status(200).json({ message: 'Block updated successfully' });
  } catch (error: any) {
    logger.error('Error updating block', { error: error.message });
    return res.status(500).json({ message: 'Failed to update block', error: error.message });
  }
};

/**
 * DELETE /churches/:churchId/blocks/:blockId
 * Remove a specific block
 */
export const deleteBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId, blockId } = req.params;

    if (!isValidObjectId(churchId) || !isValidObjectId(blockId)) {
      return res.status(400).json({ message: 'Invalid church or block ID' });
    }

    const church = await ChurchModel.findById(churchId);
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const blocks = church.pageBlocks as any[] || [];
    let removed = false;

    // Try removing from top level
    const topIndex = blocks.findIndex(b => b._id?.toString() === blockId);
    if (topIndex !== -1) {
      blocks.splice(topIndex, 1);
      removed = true;
    }

    // Try removing from children of containers
    if (!removed) {
      for (const block of blocks) {
        if (block.children && block.children.length > 0) {
          const childIndex = block.children.findIndex((c: any) => c._id?.toString() === blockId);
          if (childIndex !== -1) {
            block.children.splice(childIndex, 1);
            removed = true;
            break;
          }
        }
      }
    }

    if (!removed) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Re-normalize order after deletion
    blocks.forEach((b: any, i: number) => { b.order = i; });

    church.markModified('pageBlocks');
    await church.save();

    return res.status(200).json({ message: 'Block deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting block', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete block', error: error.message });
  }
};

/**
 * PATCH /churches/:churchId/blocks/reorder
 * Reorder blocks by providing an array of { _id, order } objects
 */
export const reorderBlocks = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const { blockOrder } = req.body;

    if (!isValidObjectId(churchId)) {
      return res.status(400).json({ message: 'Invalid church ID' });
    }

    if (!Array.isArray(blockOrder)) {
      return res.status(400).json({ message: 'blockOrder must be an array of { _id, order }' });
    }

    // Validate each item has required shape
    const isValidOrder = blockOrder.every(
      (item: any) => item && typeof item._id === 'string' && typeof item.order === 'number'
    );
    if (!isValidOrder) {
      return res.status(400).json({ message: 'Each item in blockOrder must have a string _id and a numeric order' });
    }

    const church = await ChurchModel.findById(churchId);
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const blocks = church.pageBlocks as any[] || [];

    for (const item of blockOrder) {
      const block = blocks.find(b => b._id?.toString() === item._id);
      if (block) {
        block.order = item.order;
      }
    }

    // Sort by new order
    blocks.sort((a: any, b: any) => a.order - b.order);

    church.markModified('pageBlocks');
    await church.save();

    return res.status(200).json({
      message: 'Blocks reordered successfully',
      pageBlocks: church.pageBlocks,
    });
  } catch (error: any) {
    logger.error('Error reordering blocks', { error: error.message });
    return res.status(500).json({ message: 'Failed to reorder blocks', error: error.message });
  }
};

// ============================================================================
// CHURCH THEME
// ============================================================================

/**
 * GET /churches/:churchId/theme
 * Get the church theme
 */
export const getTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const church = await ChurchModel.findById(churchId).select('theme');

    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    return res.status(200).json({ theme: church.theme || {} });
  } catch (error: any) {
    logger.error('Error fetching theme', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch theme', error: error.message });
  }
};

/**
 * PUT /churches/:churchId/theme
 * Update the church theme
 */
export const saveTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;

    if (!isValidObjectId(churchId)) {
      return res.status(400).json({ message: 'Invalid church ID' });
    }

    const { theme } = req.body;

    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ message: 'Theme must be an object' });
    }

    // Merge with existing theme instead of replacing entirely
    const church = await ChurchModel.findById(churchId).select('theme');
    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const mergedTheme = { ...(church.theme || {}), ...theme };

    const updated = await ChurchModel.findByIdAndUpdate(
      churchId,
      { $set: { theme: mergedTheme } },
      { new: true, runValidators: true }
    ).select('theme');

    return res.status(200).json({
      message: 'Theme saved successfully',
      theme: updated!.theme,
    });
  } catch (error: any) {
    logger.error('Error saving theme', { error: error.message });
    return res.status(500).json({ message: 'Failed to save theme', error: error.message });
  }
};

// ============================================================================
// MIGRATION: Legacy data → Page Blocks
// ============================================================================

/**
 * POST /churches/:churchId/blocks/migrate
 * Auto-generate pageBlocks from existing legacy church data
 */
export const migrateToBlocks = async (req: AuthRequest, res: Response) => {
  try {
    const { churchId } = req.params;
    const church = await ChurchModel.findById(churchId);

    if (!church) {
      return res.status(404).json({ message: 'Church not found' });
    }

    // Don't overwrite existing blocks
    if (church.pageBlocks && (church.pageBlocks as any[]).length > 0) {
      return res.status(400).json({
        message: 'Church already has page blocks. Use force=true to overwrite.',
      });
    }

    const blocks: any[] = [];
    let order = 0;

    // 1. Hero Banner from church image/banner
    if (church.image || (church.banner && church.banner.length > 0)) {
      const slides = (church.banner || []).map((img: string) => ({ image: img }));
      if (church.image && slides.length === 0) {
        slides.push({ image: church.image });
      }
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'hero-banner',
        order: order++,
        visible: true,
        config: {
          backgroundImage: church.image || (church.banner?.[0] || ''),
          slides: slides.length > 1 ? slides : undefined,
          title: `Welcome to ${church.name}`,
          subtitle: church.location,
          height: 'large',
          layout: slides.length > 1 ? 'slideshow' : 'contained',
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. About / Rich Text from description
    if (church.description) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'rich-text',
        order: order++,
        visible: true,
        config: {
          title: 'About Us',
          body: church.description,
          layout: 'standard',
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Leadership from principal
    if (church.principal && church.principal.pastor) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'leadership',
        order: order++,
        visible: true,
        config: {
          title: 'Leadership',
          subtitle: 'Meet our pastor',
          layout: 'featured',
          members: [{
            name: church.principal.pastor,
            role: 'Senior Pastor',
            image: church.principal.image || '',
            description: church.principal.description || '',
          }],
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Deacons from securities.deacons
    if (church.securities?.deacons && church.securities.deacons.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'section-grid',
        order: order++,
        visible: true,
        config: {
          title: 'Deacons',
          subtitle: 'Serving the body of Christ',
          layout: 'grid-3col',
          columns: 3,
          members: church.securities.deacons.map((d: any) => ({
            name: d.names || d.name || '',
            description: d.descriptions || d.description || '',
            image: d.image || '',
            role: 'Deacon',
          })),
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 5. Trustees from securities.trustees
    if (church.securities?.trustees && church.securities.trustees.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'section-grid',
        order: order++,
        visible: true,
        config: {
          title: 'Trustees',
          layout: 'grid-3col',
          columns: 3,
          members: church.securities.trustees.map((t: any) => ({
            name: t.names || t.name || '',
            description: t.descriptions || t.description || '',
            image: t.image || '',
            role: 'Trustee',
          })),
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 6. Custom Sections
    if (church.customSections && church.customSections.length > 0) {
      for (const section of church.customSections) {
        blocks.push({
          _id: new mongoose.Types.ObjectId(),
          type: 'section-grid',
          order: order++,
          visible: true,
          config: {
            title: section.sectionName,
            layout: 'grid-3col',
            columns: 3,
            members: section.members.map((m: any) => ({
              name: m.names || '',
              description: m.descriptions || '',
              image: m.image || '',
            })),
          },
          style: {},
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 7. Gallery
    if (church.gallery && church.gallery.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'gallery',
        order: order++,
        visible: true,
        config: {
          title: 'Gallery',
          layout: 'grid',
          images: church.gallery.map((url: string) => ({ url })),
          columns: 3,
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 8. Services
    if (church.liveServices && church.liveServices.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'services',
        order: order++,
        visible: true,
        config: {
          title: 'Live Services',
          layout: 'cards',
          serviceType: 'live',
          services: church.liveServices.map((s: any) => ({
            title: s.title || '',
            preacher: s.preacher || '',
            sermon: s.sermon || '',
          })),
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (church.oldServices && church.oldServices.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'services',
        order: order++,
        visible: true,
        config: {
          title: 'Past Services',
          layout: 'list',
          serviceType: 'past',
          services: church.oldServices.map((s: any) => ({
            title: s.title || '',
            preacher: s.preacher || '',
            sermon: s.sermon || '',
          })),
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 9. Songs
    if (church.songs && church.songs.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'songs',
        order: order++,
        visible: true,
        config: {
          title: 'Hymns & Songs',
          layout: 'list',
          songs: church.songs.map((s: any) => ({
            title: s.title || '',
            songUrl: s.songUrl || '',
          })),
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 10. Events
    if (church.upcomingEvents && church.upcomingEvents.length > 0) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'events',
        order: order++,
        visible: true,
        config: {
          title: 'Upcoming Events',
          layout: 'cards',
          events: church.upcomingEvents.map((e: any) => ({
            title: e.title,
            description: e.description || '',
            date: e.date,
            time: e.time || '',
            location: e.location || '',
            image: e.image || '',
          })),
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 11. Contact
    if (church.contact || church.address) {
      blocks.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'contact',
        order: order++,
        visible: true,
        config: {
          title: 'Contact Us',
          layout: 'card',
          phoneNumber: church.contact?.phoneNumber || church.phoneNumber || '',
          email: church.contact?.email || church.email || '',
          website: church.contact?.website || church.website || '',
          address: church.address || {},
          socialLinks: {
            facebook: church.contact?.facebook,
            instagram: church.contact?.instagram,
            twitter: church.contact?.twitter,
            youtube: church.contact?.youtube,
            whatsapp: church.contact?.whatsapp,
            telegram: church.contact?.telegram,
          },
        },
        style: {},
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Save the generated blocks
    church.pageBlocks = blocks as any;
    church.markModified('pageBlocks');
    await church.save();

    return res.status(200).json({
      message: `Migration complete. Generated ${blocks.length} blocks from legacy data.`,
      pageBlocks: church.pageBlocks,
      blocksGenerated: blocks.length,
    });
  } catch (error: any) {
    logger.error('Error migrating to blocks', { error: error.message });
    return res.status(500).json({ message: 'Migration failed', error: error.message });
  }
};
