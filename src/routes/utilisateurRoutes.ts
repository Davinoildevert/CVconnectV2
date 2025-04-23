import express from 'express';
import {getCVByUtilisateurId} from '../controllers/cvController';
import {
  afficherUtilisateurs,
  ajouterUtilisateur,
  supprimerUtilisateur,
  loginUtilisateur
} from '../controllers/utilisateurController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getProfilConnecte } from '../controllers/utilisateurController';
const router = express.Router();

router.get('/:id/cv', authMiddleware, getCVByUtilisateurId);

router.get('/', afficherUtilisateurs);
router.post('/', ajouterUtilisateur);
router.delete('/:id', authMiddleware, supprimerUtilisateur);
router.post('/login', loginUtilisateur); //  Login ici
router.get('/test-protected', authMiddleware, (req, res) => {
  res.json({ message: `Bienvenue ${req.user?.nom}`, user: req.user });


router.get('/me', authMiddleware, getProfilConnecte);
});

export default router;



