import express from 'express';
import {
  afficherCVs,
  ajouterCV,
  getCVByUtilisateurId,
  updateCVByUtilisateurId, supprimerCVParUtilisateur
} from '../controllers/cvController';
import { ajouterCVParCandidat, renderGenerateCV  } from '../controllers/cvController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRole';
import { getCVById, telechargerCVenPDF } from "../controllers/cvController";
import {
  ajouterFavori,
  retirerFavori,
  listerFavoris,
  checkFavori
} from '../controllers/cvController';
import {
  getNotifications,
  marquerNotificationCommeLue
} from '../controllers/cvController';
import {
  ajouterSuggestion,
  listerSuggestions
} from '../controllers/cvController';

const router = express.Router();

router.get('/',  authMiddleware, afficherCVs);

router.get('/utilisateurs/:id/cv', getCVByUtilisateurId);
router.put('/utilisateurs/:id/cv', updateCVByUtilisateurId); 

router.post('/create', authMiddleware, checkRole('candidat'), ajouterCVParCandidat);

router.delete('/utilisateurs/:id/cv', authMiddleware, supprimerCVParUtilisateur);

router.get('/generate-cv', authMiddleware, checkRole('candidat'), renderGenerateCV);

// ⭐ Gérer les favoris (recruteurs uniquement)
router.post('/favoris', authMiddleware, checkRole('recruteur'), ajouterFavori);
router.delete('/favoris/:cvId', authMiddleware, checkRole('recruteur'), retirerFavori);
router.get('/favoris', authMiddleware, checkRole('recruteur'), listerFavoris);
router.get('/favoris/check/:cvId', authMiddleware, checkRole('recruteur'), checkFavori);

// 🔔 Notifications pour l'utilisateur connecté
router.get('/notifications', authMiddleware, getNotifications);
router.patch('/notifications/:id', authMiddleware, marquerNotificationCommeLue);

// 💬 Suggestions (candidat ou recruteur)
router.post('/suggestions', authMiddleware, ajouterSuggestion);

// 🔐 Voir toutes les suggestions (admin uniquement)
router.get('/suggestions', authMiddleware, checkRole('admin'), listerSuggestions);

// Route publique pour recruteur
router.get('/:id', getCVById); // GET /cvs/3
router.get('/:id/pdf', authMiddleware, telechargerCVenPDF);

export default router;
