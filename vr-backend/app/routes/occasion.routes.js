import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  getOccasions,
  createOccasion,
  updateOccasion,
  deleteOccasion,
  getOccasionOutfits,
  assignOutfitsToOccasion
} from '../controllers/occasion.controller.js';

const router = express.Router();

// Get all occasions for the user
router.get('/', authMiddleware, getOccasions);

// Create a new occasion
router.post('/', authMiddleware, createOccasion);

// Get outfits for a specific occasion
router.get('/:id/outfits', authMiddleware, getOccasionOutfits);

// Update an occasion (including thumbnail)
router.patch('/:id', authMiddleware, updateOccasion);

// Delete an occasion
router.delete('/:id', authMiddleware, deleteOccasion);

// Assign outfits to an occasion
router.post('/assign', authMiddleware, assignOutfitsToOccasion);

export default router; 