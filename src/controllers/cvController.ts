import { Request, Response } from 'express';
import { getAllCVs, saveCVs  } from '../models/cvModel';
import { getAllCompetences } from '../models/competenceModel';
import { addCV, CV } from '../models/cvModel';
import { getAllUtilisateurs } from '../models/utilisateurModel';


//  Fonction GET /cvs avec noms des compétences
export function afficherCVs(req: Request, res: Response): void {
    const cvs = getAllCVs();
    const competences = getAllCompetences();
    const utilisateurs = getAllUtilisateurs();
  
    // Dictionnaire : { id: nom_compétence }
    const mapCompetences = new Map<number, string>();
    competences.forEach(comp => {
      mapCompetences.set(comp.id, comp.nom);
    });
  
    // Dictionnaire : { id: utilisateur }
    const mapUtilisateurs = new Map<number, { id: number; nom: string; email: string; role: string }>();
    utilisateurs.forEach(user => {
      mapUtilisateurs.set(user.id, {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role
      });
    });
  
    // Transformation finale
    const cvsAvecDetails = cvs.map(cv => ({
      id: cv.id,
      titre: cv.titre,
      utilisateur: mapUtilisateurs.get(cv.utilisateurId) || { id: cv.utilisateurId, nom: 'Inconnu', email: '', role: '' },
      competences: cv.competences.map(id => mapCompetences.get(id) || 'Inconnue')
    }));
  
    res.json(cvsAvecDetails);
  }


//  Fonction pour GET /utilisateurs/:id/cv
export function getCVByUtilisateurId(req: Request, res: Response): void {
  const utilisateurIdParam = parseInt(req.params.id);

  if (isNaN(utilisateurIdParam)) {
    res.status(400).json({ message: 'ID utilisateur invalide.' });
    return;
  }

  // Vérifier l'accès
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  // 🛡️ Si c’est un candidat, il ne peut voir que son propre CV
  if (user.role === 'candidat' && user.id !== utilisateurIdParam) {
    res.status(403).json({ message: 'Accès interdit à ce CV.' });
    return; 
  }

  // Ensuite on continue normalement
  const cvs = getAllCVs();
  const competences = getAllCompetences();
  const utilisateurs = getAllUtilisateurs();

  const cv = cvs.find(c => c.utilisateurId === utilisateurIdParam);
  if (!cv) {
    res.status(404).json({ message: 'Aucun CV trouvé pour cet utilisateur.' });
    return;
  }

  const utilisateur = utilisateurs.find(u => u.id === utilisateurIdParam);
  if (!utilisateur) {
    res.status(404).json({ message: 'Utilisateur introuvable.' });
    return;
  }

  const mapCompetences = new Map<number, string>();
  competences.forEach(c => mapCompetences.set(c.id, c.nom));

  const cvAvecInfos = {
    id: cv.id,
    titre: cv.titre,
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role
    },
    competences: cv.competences.map(id => mapCompetences.get(id) || 'Inconnue')
  };

  res.json(cvAvecInfos);
}


//  Fonction pour POST /cvs
export function ajouterCV(req: Request, res: Response): void {
  const { utilisateurId, titre, competences } = req.body;

  // Validation basique
  if (!utilisateurId || !titre || !Array.isArray(competences)) {
    res.status(400).json({ message: 'Champs requis manquants ou invalides.' });
    return;
  }

  const nouveauCV: CV = {
    id: 0, // Généré automatiquement dans le modèle
    utilisateurId,
    titre,
    competences
  };

  addCV(nouveauCV);
  res.status(201).json({ message: 'CV ajouté avec succès.' });
}


//  PUT /utilisateurs/:id/cv → modifier le CV complet d’un utilisateur
export function updateCVByUtilisateurId(req: Request, res: Response): void {
  const utilisateurId = parseInt(req.params.id);
  const { titre, competences } = req.body;

  if (isNaN(utilisateurId)) {
    res.status(400).json({ message: 'ID utilisateur invalide.' });
    return;
  }

  if (!titre || !Array.isArray(competences)) {
    res.status(400).json({ message: 'Champs "titre" et "competences" requis.' });
    return;
  }

  const cvs = getAllCVs();
  const index = cvs.findIndex(cv => cv.utilisateurId === utilisateurId);

  if (index === -1) {
    res.status(404).json({ message: 'Aucun CV trouvé pour cet utilisateur.' });
    return;
  }

  //  Mise à jour du CV
  cvs[index].titre = titre;
  cvs[index].competences = competences;

  //  Enregistrer les modifications
  saveCVs(cvs);

  res.status(200).json({ message: 'CV mis à jour avec succès.', cv: cvs[index] });
}
