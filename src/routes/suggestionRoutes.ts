import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRole';
import { ajouterSuggestion, getSuggestions } from '../controllers/suggestionController';

const router = express.Router();

// 📤 Soumettre une suggestion (utilisateur connecté)
router.post('/', authMiddleware, ajouterSuggestion);

// 📥 Consulter toutes les suggestions (admin uniquement)
router.get('/', authMiddleware, checkRole('admin'), getSuggestions);

export default router;
