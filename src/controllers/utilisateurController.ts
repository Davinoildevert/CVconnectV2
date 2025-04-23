import { Request, Response } from 'express';
import { getAllUtilisateurs, deleteUtilisateur, Utilisateur, addUtilisateur, findUtilisateurByEmail } from '../models/utilisateurModel';
import { deleteCVsByUtilisateurId, addCV, CV } from '../models/cvModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../configs/jwt.config'; // ← On va le créer juste après
//  Fonction pour répondre à GET /utilisateurs
export function afficherUtilisateurs(req: Request, res: Response): void {
  const utilisateurs = getAllUtilisateurs();
  res.json(utilisateurs);
}


export async function ajouterUtilisateur(req: Request, res: Response): Promise<void>  {
  const { nom, email, role, password, titreCV, competences } = req.body;


  //  Vérification des champs de base
  if (!nom || !email || !role || !password) {
    res.status(400).json({ message: 'Nom, email, rôle et mot de passe requis.' });
    return;
  }
  

  // Vérification : si un CV doit être généré, il faut un titre et des compétences
  if ((titreCV && !Array.isArray(competences)) || (competences && !titreCV)) {
    res.status(400).json({ message: 'Pour générer un CV automatiquement, fournissez "titreCV" et "competences".' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //  Création de l'utilisateur (ID généré dans le modèle)
  const nouvelUtilisateur: Utilisateur = {
    id: 0,
    nom,
    email,
    role,
    password: hashedPassword
  };

  addUtilisateur(nouvelUtilisateur);

  //  Génération automatique du CV si demandé
  if (titreCV && Array.isArray(competences)) {
    const nouveauCV: CV = {
      id: 0,
      utilisateurId: nouvelUtilisateur.id, //  Attention, il est encore à 0 ici !
      titre: titreCV,
      competences
    };

    //  Corriger l'ID utilisateur avec l'ID réel généré
    const utilisateurs = require('../models/utilisateurModel').getAllUtilisateurs();
    const lastUtilisateur = utilisateurs[utilisateurs.length - 1];
    nouveauCV.utilisateurId = lastUtilisateur.id;

    addCV(nouveauCV);
  }

  res.status(201).json({ message: 'Utilisateur (et CV si fourni) ajouté avec succès.' });
}


//  Fonction DELETE /utilisateurs/:id
export function supprimerUtilisateur(req: Request, res: Response): void {
  const id = parseInt(req.params.id);
  const user = req.user;

  if (isNaN(id)) {
    res.status(400).json({ message: 'ID invalide.' });
    return;
  }

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  //  Vérifie que l'utilisateur connecté correspond à l'ID
  if (user.role !== 'candidat' || user.id !== id) {
    res.status(403).json({ message: 'Vous ne pouvez supprimer que votre propre compte.' });
    return;
  }

  //  Effet cascade : supprimer les CV liés
  deleteCVsByUtilisateurId(id);

  //  Supprimer l'utilisateur
  deleteUtilisateur(id);

  res.json({ message: 'Utilisateur et CVs associés supprimés.' });
}




//  Fonction pour POST /login
export async function loginUtilisateur(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email et mot de passe requis.' });
    return;
  }

  const utilisateur = findUtilisateurByEmail(email);
  if (!utilisateur) {
    res.status(401).json({ message: 'Identifiants invalides.' });
    return;
  }

  const estValide = await bcrypt.compare(password, utilisateur.password);
  if (!estValide) {
    res.status(401).json({ message: 'Mot de passe incorrect.' });
    return;
  }

  //  Créer un token
  const token = jwt.sign(
    {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role
    },
    SECRET_KEY,
    { expiresIn: '1h' } 
  );

  //  Retourner le token dans la réponse
  res.status(200).json({
    message: 'Connexion réussie',
    token, 
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role
    }
  });
}
export function getProfilConnecte(req: Request, res: Response): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  res.status(200).json({
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role
  });
}
