import express from 'express';
import { loginAdminDev, getTousUtilisateurs } from '../controllers/adminController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRole';
import { getTousCVs, getCVDetails } from '../controllers/adminController';
import { supprimerUtilisateurParAdmin } from '../controllers/adminController';
import { supprimerCVParAdmin } from '../controllers/adminController';
import { changerStatutUtilisateur } from '../controllers/adminController';
import { getStats } from '../controllers/adminController';
import { getAllCompetences, addCompetence, deleteCompetence } from '../controllers/competenceController';
import { getSuggestions, createSuggestion, updateStatus } from '../controllers/suggestionController';

const router = express.Router();

router.post('/login-dev', loginAdminDev);
router.get('/utilisateurs', authMiddleware, checkRole('admin'), getTousUtilisateurs);
router.get('/cvs', authMiddleware, checkRole('admin'), getTousCVs);
router.get('/cvs/:id', authMiddleware, checkRole('admin'), getCVDetails);
router.delete('/utilisateurs/:id', authMiddleware, checkRole('admin'), supprimerUtilisateurParAdmin);
router.delete('/cvs/:id', authMiddleware, checkRole('admin'), supprimerCVParAdmin);
router.patch('/utilisateurs/:id/status', authMiddleware, checkRole('admin'), changerStatutUtilisateur);
router.get('/stats', authMiddleware, checkRole('admin'), getStats);
router.get('/competences', authMiddleware, checkRole('admin'), getAllCompetences);
router.post('/competences', authMiddleware, checkRole('admin'), addCompetence);
router.delete('/competences/:id', authMiddleware, checkRole('admin'), deleteCompetence);

// Routes pour les suggestions
router.get('/suggestions', authMiddleware, checkRole('admin'), getSuggestions);
router.post('/suggestions', authMiddleware, checkRole('admin'), createSuggestion);
router.patch('/suggestions/:id/status', authMiddleware, checkRole('admin'), updateStatus);

export default router;
