import { Request, Response } from 'express';
import { getAllCVs, saveCVs } from '../models/cvModel';
import { getAllCompetences as getCompetences, addCompetence as addCompetenceModel, deleteCompetence as deleteCompetenceModel, Competence } from '../models/competenceModel';

// Récupérer toutes les compétences
export function getAllCompetences(req: Request, res: Response): void {
  const competences = getCompetences();
  res.status(200).json(competences);
}

// Ajouter une nouvelle compétence
export function addCompetence(req: Request, res: Response): void {
  const { nom } = req.body;

  if (!nom || typeof nom !== 'string') {
    res.status(400).json({ message: 'Le nom de la compétence est requis.' });
    return;
  }

  const nouvelleCompetence: Competence = {
    id: 0, // L'ID sera généré par le modèle
    nom: nom
  };

  addCompetenceModel(nouvelleCompetence);
  res.status(201).json(nouvelleCompetence);
}

// Supprimer une compétence
export function deleteCompetence(req: Request, res: Response): void {
  const competenceId = parseInt(req.params.id);

  if (isNaN(competenceId)) {
    res.status(400).json({ message: 'ID de compétence invalide.' });
    return;
  }

  const cvs = getAllCVs();
  let modified = false;

  // Supprimer la compétence de tous les CVs
  cvs.forEach(cv => {
    if (Array.isArray(cv.competences)) {
      const originalLength = cv.competences.length;
      cv.competences = cv.competences.filter(comp => comp !== competenceId);
      if (cv.competences.length !== originalLength) {
        modified = true;
      }
    }
  });

  if (modified) {
    saveCVs(cvs);
    deleteCompetenceModel(competenceId);
    res.status(200).json({ message: 'Compétence supprimée avec succès' });
  } else {
    res.status(404).json({ message: 'Compétence non trouvée' });
  }
}
