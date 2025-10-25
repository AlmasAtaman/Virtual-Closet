/**
 * Analytics Tracking Utilities
 * Backend analytics for tracking clothing item engagement and usage patterns
 * These metrics are never shown to the user but provide insights for future features
 */

import prisma from "../models/index.js";

/**
 * Track when a user views an item detail
 * Call this when ClothingDetailModal is opened
 *
 * @param {string} itemId - The clothing item ID
 * @returns {Promise<void>}
 */
export async function trackItemView(itemId) {
  try {
    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date()
      }
    });
  } catch (error) {
    // Silent fail - analytics should never break user experience
    console.error('[Analytics] Failed to track item view:', error.message);
  }
}

/**
 * Track when an item is added to an outfit
 * Call this when creating or updating an outfit with new items
 *
 * @param {string} itemId - The clothing item ID
 * @returns {Promise<void>}
 */
export async function trackOutfitInclusion(itemId) {
  try {
    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        outfitCount: { increment: 1 }
      }
    });
  } catch (error) {
    console.error('[Analytics] Failed to track outfit inclusion:', error.message);
  }
}

/**
 * Track when an item is removed from an outfit
 * Call this when removing an item from an outfit
 *
 * @param {string} itemId - The clothing item ID
 * @returns {Promise<void>}
 */
export async function trackOutfitRemoval(itemId) {
  try {
    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        outfitCount: { decrement: 1 }
      }
    });
  } catch (error) {
    console.error('[Analytics] Failed to track outfit removal:', error.message);
  }
}

/**
 * Track when favorite status changes
 * Call this when user toggles favorite on/off
 *
 * @param {string} itemId - The clothing item ID
 * @param {boolean} newState - The new favorite state
 * @returns {Promise<void>}
 */
export async function trackFavoriteToggle(itemId, newState) {
  try {
    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        isFavorite: newState,
        favoriteToggles: { increment: 1 }
      }
    });
  } catch (error) {
    console.error('[Analytics] Failed to track favorite toggle:', error.message);
  }
}

/**
 * Track AI-generated item with comparison of AI suggestions vs final user data
 * Call this after user submits an item that was auto-filled by AI
 *
 * @param {string} itemId - The clothing item ID
 * @param {object} aiSuggestions - Original AI suggestions from Gemini
 * @param {object} userFinalData - Final data submitted by user
 * @param {string} uploadMethod - "direct" | "url" | "scraper"
 * @returns {Promise<void>}
 */
export async function trackAIUsage(itemId, aiSuggestions, userFinalData, uploadMethod = "direct") {
  try {
    // Compare AI suggestions with user's final choices
    const edits = {};
    const fieldsToTrack = ['name', 'brand', 'category', 'type', 'tags', 'color', 'season', 'size'];

    for (const field of fieldsToTrack) {
      const aiValue = aiSuggestions[field];
      const userValue = userFinalData[field];

      // Track if user changed the AI suggestion
      if (aiValue !== undefined && JSON.stringify(aiValue) !== JSON.stringify(userValue)) {
        edits[field] = {
          ai: aiValue,
          user: userValue
        };
      }
    }

    // Extract source domain if sourceUrl exists
    let sourceDomain = null;
    if (userFinalData.sourceUrl) {
      try {
        const url = new URL(userFinalData.sourceUrl);
        sourceDomain = url.hostname.replace('www.', '');
      } catch (e) {
        // Invalid URL, ignore
      }
    }

    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        aiGenerated: true,
        aiSuggestions: aiSuggestions,
        userEdits: edits,
        uploadMethod: uploadMethod,
        sourceDomain: sourceDomain
      }
    });
  } catch (error) {
    console.error('[Analytics] Failed to track AI usage:', error.message);
  }
}

/**
 * Track upload method for items not using AI
 * Call this when user manually adds an item without AI auto-fill
 *
 * @param {string} itemId - The clothing item ID
 * @param {string} uploadMethod - "direct" | "url" | "scraper"
 * @param {string|null} sourceUrl - The source URL if from web
 * @returns {Promise<void>}
 */
export async function trackUploadMethod(itemId, uploadMethod, sourceUrl = null) {
  try {
    let sourceDomain = null;
    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl);
        sourceDomain = url.hostname.replace('www.', '');
      } catch (e) {
        // Invalid URL, ignore
      }
    }

    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        uploadMethod: uploadMethod,
        sourceDomain: sourceDomain
      }
    });
  } catch (error) {
    console.error('[Analytics] Failed to track upload method:', error.message);
  }
}

/**
 * Batch track outfit inclusions for multiple items
 * Call this when creating a new outfit with multiple items
 *
 * @param {string[]} itemIds - Array of clothing item IDs
 * @returns {Promise<void>}
 */
export async function trackBatchOutfitInclusion(itemIds) {
  try {
    await prisma.clothing.updateMany({
      where: { id: { in: itemIds } },
      data: {
        outfitCount: { increment: 1 }
      }
    });
  } catch (error) {
    console.error('[Analytics] Failed to batch track outfit inclusions:', error.message);
  }
}

/**
 * Get analytics summary for a user's wardrobe (for future admin/insights features)
 * This is not currently exposed to users
 *
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Analytics summary
 */
export async function getWardrobeAnalytics(userId) {
  try {
    const items = await prisma.clothing.findMany({
      where: { userId },
      select: {
        viewCount: true,
        outfitCount: true,
        favoriteToggles: true,
        aiGenerated: true,
        uploadMethod: true,
        category: true,
        tags: true,
        createdAt: true
      }
    });

    const totalItems = items.length;
    const aiGeneratedCount = items.filter(i => i.aiGenerated).length;
    const averageViews = totalItems > 0
      ? items.reduce((sum, i) => sum + i.viewCount, 0) / totalItems
      : 0;
    const mostViewedItems = items.sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
    const mostUsedInOutfits = items.sort((a, b) => b.outfitCount - a.outfitCount).slice(0, 10);

    return {
      totalItems,
      aiGeneratedCount,
      aiGeneratedPercentage: totalItems > 0 ? (aiGeneratedCount / totalItems * 100).toFixed(1) : 0,
      averageViews: averageViews.toFixed(2),
      mostViewedItems,
      mostUsedInOutfits
    };
  } catch (error) {
    console.error('[Analytics] Failed to get wardrobe analytics:', error.message);
    return null;
  }
}
