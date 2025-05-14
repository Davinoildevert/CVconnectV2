import express from 'express';
import {getCVByUtilisateurId} from '../controllers/cvController';
import {
  afficherUtilisateurs,
  ajouterUtilisateur,
  supprimerUtilisateur,
  loginUtilisateur,
  getProfilConnecte,
  updateProfil,
  verifyPassword,
  changePassword
} from '../controllers/utilisateurController';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  demanderResetPassword,
  reinitialiserPassword
} from '../controllers/utilisateurController';
import {
  envoyerMessage,
  lireMessages,
  lireTousMessages,
  compterMessagesNonLus
} from '../controllers/utilisateurController';
import { compterNotificationsNonLues } from '../controllers/utilisateurController';

const router = express.Router();

router.get('/:id/cv', authMiddleware, getCVByUtilisateurId);

router.get('/', afficherUtilisateurs);
router.post('/', ajouterUtilisateur);
router.delete('/:id', authMiddleware, supprimerUtilisateur);
router.post('/login', loginUtilisateur); //  Login ici
router.get('/test-protected', authMiddleware, (req, res) => {
  res.json({ message: `Bienvenue ${req.user?.nom}`, user: req.user });


});

router.get('/me', authMiddleware, getProfilConnecte);
router.put('/me', authMiddleware, updateProfil);

// Demande de réinitialisation (génère un token)
router.post('/reset-password-request', demanderResetPassword);

// Réinitialisation avec le token reçu
router.post('/reset-password/:token', reinitialiserPassword);
// ✉️ Messagerie interne
router.post('/messages', authMiddleware, envoyerMessage);
router.get('/messages/conversation/:userId', authMiddleware, lireMessages);
router.get('/messages', authMiddleware, lireTousMessages);
router.get('/messages/non-lus', authMiddleware, compterMessagesNonLus);


router.get('/notifications/unread-count', authMiddleware, compterNotificationsNonLues);

// Routes pour le changement de mot de passe
router.post('/verify-password', authMiddleware, verifyPassword);
router.put('/change-password', authMiddleware, changePassword);

export default router;



