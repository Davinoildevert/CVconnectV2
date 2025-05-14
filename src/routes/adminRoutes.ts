import express from 'express';
import { loginAdminDev, getTousUtilisateurs } from '../controllers/adminController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRole';
import { getTousCVs } from '../controllers/adminController';
import { supprimerUtilisateurParAdmin } from '../controllers/adminController';
import { supprimerCVParAdmin } from '../controllers/adminController';
import { changerStatutUtilisateur } from '../controllers/adminController';
import { getStats } from '../controllers/adminController';

const router = express.Router();

router.post('/login-dev', loginAdminDev);
router.get('/utilisateurs', authMiddleware, checkRole('admin'), getTousUtilisateurs);


router.get('/cvs', authMiddleware, checkRole('admin'), getTousCVs);


router.delete('/utilisateurs/:id', authMiddleware, checkRole('admin'), supprimerUtilisateurParAdmin);


router.delete('/cvs/:id', authMiddleware, checkRole('admin'), supprimerCVParAdmin);


router.patch('/utilisateurs/:id/status', authMiddleware, checkRole('admin'), changerStatutUtilisateur);

router.get('/stats', authMiddleware, checkRole('admin'), getStats);

export default router;
