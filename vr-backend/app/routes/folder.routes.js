import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  getFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderItems,
  addItemToFolder,
  removeItemFromFolder
} from '../controllers/folder.controller.js';

const router = express.Router();

// Get all folders for the user
router.get('/', authMiddleware, getFolders);

// Get a single folder by ID
router.get('/:id', authMiddleware, getFolder);

// Create a new folder
router.post('/', authMiddleware, createFolder);

// Update a folder
router.put('/:id', authMiddleware, updateFolder);

// Delete a folder
router.delete('/:id', authMiddleware, deleteFolder);

// Get all items in a folder
router.get('/:id/items', authMiddleware, getFolderItems);

// Add item to folder
router.post('/:id/items', authMiddleware, addItemToFolder);

// Remove item from folder
router.delete('/:id/items/:itemId', authMiddleware, removeItemFromFolder);

export default router;
