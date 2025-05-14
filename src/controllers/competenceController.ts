import { Request, Response } from 'express';
import { getAllCompetences } from '../models/competenceModel';
import { addCompetence, Competence } from '../models/competenceModel';
import { deleteCompetence } from '../models/competenceModel';
import { removeCompetenceFromCVs } from '../models/cvModel';


//  Fonction pour gérer GET /competences
export function afficherCompetences(req: Request, res: Response): void {
  const competences = getAllCompetences();
  res.json(competences);
}

//  Fonction pour POST /competences
export function ajouterCompetence(req: Request, res: Response): void {
  const { nom } = req.body;

  // Vérification simple
  if (!nom) {
    res.status(400).json({ message: 'Le nom de la compétence est requis.' });
    return;
  }

  const nouvelleCompetence: Competence = {
    id: 0, 
    nom
  };

  addCompetence(nouvelleCompetence);
  res.status(201).json({ message: 'Compétence ajoutée avec succès.' });
}

//  Fonction DELETE /competences/:id
export function supprimerCompetence(req: Request, res: Response): void {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ message: 'ID invalide.' });
    return;
  }

  // Retirer la compétence de tous les CVs
  removeCompetenceFromCVs(id);

  // Supprimer la compétence du fichier
  deleteCompetence(id);

  res.json({ message: 'Compétence supprimée et retirée des CVs.' });
}
