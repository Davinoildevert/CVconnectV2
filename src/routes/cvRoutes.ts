import express from 'express';
import {
  afficherCVs,
  ajouterCV,
  getCVByUtilisateurId,
  updateCVByUtilisateurId
} from '../controllers/cvController';

const router = express.Router();

router.get('/', afficherCVs);
router.post('/', ajouterCV);
router.get('/utilisateurs/:id/cv', getCVByUtilisateurId);
router.put('/utilisateurs/:id/cv', updateCVByUtilisateurId); 
export default router;
