import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../configs/jwt.config';
import { getAllUtilisateurs } from '../models/utilisateurModel';
import { getAllCVs, saveCVs} from '../models/cvModel';
import { getAllCompetences } from '../models/competenceModel';
import { deleteUtilisateur } from '../models/utilisateurModel';
import { deleteCVsByUtilisateurId } from '../models/cvModel';
import { toggleStatutUtilisateur } from '../models/utilisateurModel';

export function loginAdminDev(req: Request, res: Response): void {
  const { key } = req.body;

  // Vérifie que la clé est envoyée
  if (!key) {
    res.status(400).json({ message: 'Clé requise pour accéder.' });
    return;
  }

  // Compare avec la clé du .env
  if (key !== process.env.ADMIN_SECRET_KEY) {
    res.status(401).json({ message: 'Clé invalide. Accès refusé.' });
    return;
  }

  // Si la clé est correcte, on crée un token admin
  const adminToken = jwt.sign(
    {
      id: 0, 
      nom: 'Admin Dev',
      email: 'admin@cvconnect.com',
      role: 'admin'
    },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.status(200).json({
    message: 'Connexion admin réussie',
    token: adminToken
  });
}

//  GET /admin/utilisateurs → Liste complète
export function getTousUtilisateurs(req: Request, res: Response): void {
    const utilisateurs = getAllUtilisateurs();
    res.status(200).json(utilisateurs);
  }
  

  //  GET /admin/cvs → liste complète
  export function getTousCVs(req: Request, res: Response): void {
    const cvs = getAllCVs();
    const competences = getAllCompetences();
    const utilisateurs = getAllUtilisateurs();
  
    const mapCompetences = new Map<number, string>();
    competences.forEach(c => mapCompetences.set(c.id, c.nom));
  
    const mapUtilisateurs = new Map<number, { nom: string; email: string; role: string }>();
    utilisateurs.forEach(u => {
      mapUtilisateurs.set(u.id, {
        nom: u.nom,
        email: u.email,
        role: u.role
      });
    });
  
    const cvsAvecInfos = cvs.map(cv => ({
      id: cv.id,
      titre: cv.titre,
      utilisateur: mapUtilisateurs.get(cv.utilisateurId) || {},
      competences: cv.competences.map(id => {
        const numId = typeof id === 'string' ? parseInt(id) : id;
        return mapCompetences.get(numId) || 'Inconnue';
      })
    }));
  
    res.status(200).json(cvsAvecInfos);
  }


export function supprimerUtilisateurParAdmin(req: Request, res: Response): void {
  const utilisateurId = parseInt(req.params.id);

  if (isNaN(utilisateurId)) {
    res.status(400).json({ message: 'ID invalide.' });
    return;
  }

  // Supprimer d'abord les CVs liés
  deleteCVsByUtilisateurId(utilisateurId);

  // Puis supprimer l'utilisateur
  deleteUtilisateur(utilisateurId);

  res.status(200).json({ message: 'Utilisateur et CVs associés supprimés.' });
}


export function supprimerCVParAdmin(req: Request, res: Response): void {
  const cvId = parseInt(req.params.id);

  if (isNaN(cvId)) {
    res.status(400).json({ message: 'ID de CV invalide.' });
    return;
  }

  const cvs = getAllCVs();
  const index = cvs.findIndex(cv => cv.id === cvId);

  if (index === -1) {
    res.status(404).json({ message: 'CV non trouvé.' });
    return;
  }

  cvs.splice(index, 1); // Supprime le CV
  saveCVs(cvs);         // Sauvegarde le fichier

  res.status(200).json({ message: 'CV supprimé avec succès.' });
}


export function changerStatutUtilisateur(req: Request, res: Response): void {
  const utilisateurId = parseInt(req.params.id);
  const { actif } = req.body;

  if (isNaN(utilisateurId) || typeof actif !== "boolean") {
    res.status(400).json({ message: 'Requête invalide.' });
    return;
  }

  const ok = toggleStatutUtilisateur(utilisateurId, actif);
  if (!ok) {
    res.status(404).json({ message: 'Utilisateur introuvable.' });
    return;
  }

  res.status(200).json({ message: `Utilisateur ${actif ? 'réactivé' : 'suspendu'} avec succès.` });
}
export function getStats(req: Request, res: Response): void {
  const utilisateurs = getAllUtilisateurs();
  const cvs = getAllCVs();
  const competences = getAllCompetences();

  const stats = {
    totalUtilisateurs: utilisateurs.length,
    totalCandidats: utilisateurs.filter(u => u.role === 'candidat').length,
    totalRecruteurs: utilisateurs.filter(u => u.role === 'recruteur').length,
    totalCVs: cvs.length,
    totalCompetences: competences.length
  };

  res.status(200).json(stats);
}
