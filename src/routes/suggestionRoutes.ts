import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRole';
import { createSuggestion, getSuggestions, updateStatus } from '../controllers/suggestionController';

const router = express.Router();

// Route publique pour ajouter une suggestion
router.post('/', authMiddleware, createSuggestion);

// Routes admin pour gérer les suggestions
router.get('/', authMiddleware, checkRole('admin'), getSuggestions);
router.patch('/:id/status', authMiddleware, checkRole('admin'), updateStatus);

export default router;
