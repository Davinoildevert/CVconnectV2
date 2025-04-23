import express from 'express';
import { afficherCompetences, ajouterCompetence, supprimerCompetence } from '../controllers/competenceController';

const router = express.Router();

router.get('/', afficherCompetences);
router.post('/', ajouterCompetence);
router.delete('/:id', supprimerCompetence);

export default router;
