import express from 'express';
import { getAllCompetences, addCompetence, deleteCompetence } from '../controllers/competenceController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRole';

const router = express.Router();

// Routes publiques
router.get('/', getAllCompetences);

// Routes protégées (admin)
router.post('/', authMiddleware, checkRole('admin'), addCompetence);
router.delete('/:id', authMiddleware, checkRole('admin'), deleteCompetence);

export default router;
