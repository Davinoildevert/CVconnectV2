import { Request, Response } from 'express';
import { getAllUtilisateurs, deleteUtilisateur, Utilisateur, addUtilisateur, findUtilisateurByEmail } from '../models/utilisateurModel';
import { deleteCVsByUtilisateurId, addCV, CV } from '../models/cvModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../configs/jwt.config'; // ← On va le créer juste après
import { setResetToken, resetPasswordByToken } from '../models/utilisateurModel';
import { v4 as uuidv4 } from 'uuid'; // Génère des tokens uniques
import fs from 'fs';
import path from 'path';

//  Fonction pour répondre à GET /utilisateurs
export function afficherUtilisateurs(req: Request, res: Response): void {
  const utilisateurs = getAllUtilisateurs();
  res.json(utilisateurs);
}


export async function ajouterUtilisateur(req: Request, res: Response): Promise<void>  {
  const { nom, email, role, password, titreCV, competences, entreprise, siret, dateNaissance } = req.body;
  if (findUtilisateurByEmail(email)) {
  res.status(409).json({ message: "Un compte existe déjà avec cet email." });
  return;
}

  if (role === 'recruteur' && (!entreprise || !siret)) {
  res.status(400).json({ message: "Les recruteurs doivent fournir le nom de l'entreprise et le numéro SIRET." });
  return;
}
if (role === 'recruteur' && !/^\d+$/.test(siret)) {
  res.status(400).json({ message: 'Le numéro SIRET doit contenir uniquement des chiffres.' });
  return;
}


  //  Vérification des champs de base
  if (!nom || !email || !role || !password) {
  res.status(400).json({ message: 'Nom, email, rôle et mot de passe requis.' });
  return;
}
if (role === 'candidat') {
  if (!dateNaissance) {
    res.status(400).json({ message: 'La date de naissance est requise pour les candidats.' });
    return;
  }

  const naissance = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - naissance.getFullYear();
  const m = now.getMonth() - naissance.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < naissance.getDate())) {
    age--;
  }

  if (age < 16) {
    res.status(400).json({ message: 'Vous devez avoir au moins 16 ans pour vous inscrire.' });
    return;
  }
}


// Ajout de la validation du mot de passe
const estLongAssez = password.length >= 6;
const contientLettre = /[a-zA-Z]/.test(password);
const contientChiffre = /\d/.test(password);

if (!estLongAssez || !contientLettre || !contientChiffre) {
  res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères, avec au moins une lettre et un chiffre.' });
  return;
}

  
  if (role !== 'candidat' && role !== 'recruteur') {
    res.status(400).json({ message: 'Rôle non autorisé.' });
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
    password: hashedPassword,
    actif: true,
    entreprise,
    siret,
    dateNaissance,
    date_inscription: new Date().toISOString()
  };



   const utilisateurCree = addUtilisateur(nouvelUtilisateur);

  // Génération automatique du CV si demandé
  if (titreCV && Array.isArray(competences)) {
    const nouveauCV: CV = {
      id: 0,
      utilisateurId: utilisateurCree.id,
      titre: titreCV,
      competences
    };

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

  // Standardiser le rôle
  const role = utilisateur.role === 'recruteur' ? 'recruteur' : utilisateur.role;

  // Créer un token avec le rôle standardisé
  const token = jwt.sign(
    {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: role
    },
    SECRET_KEY,
    { expiresIn: '1h' } 
  );

  // Retourner le token dans la réponse
  res.status(200).json({
    message: 'Connexion réussie',
    token, 
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: role
    }
  });
}
export function getProfilConnecte(req: Request, res: Response): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  // Récupérer l'utilisateur complet depuis la base de données
  const utilisateur = findUtilisateurByEmail(user.email);
  if (!utilisateur) {
    res.status(404).json({ message: 'Utilisateur non trouvé.' });
    return;
  }

  res.status(200).json({
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role,
    date_naissance: utilisateur.dateNaissance
  });
}
export function demanderResetPassword(req: Request, res: Response): void {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email requis.' });
    return;
  }

  const utilisateur = findUtilisateurByEmail(email);
  if (!utilisateur) {
    res.status(404).json({ message: 'Aucun compte associé à cet email.' });
    return;
  }

  const token = uuidv4();
  const expiration = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute

  setResetToken(email, token, expiration);

  res.status(200).json({
    message: 'Lien de réinitialisation généré',
    resetLink: `http://localhost:3000/reset-password/${token}`
  });
}
export async function reinitialiserPassword(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
    return;
  }

  const estLongAssez = newPassword.length >= 6;
  const contientLettre = /[a-zA-Z]/.test(newPassword);
  const contientChiffre = /\d/.test(newPassword);

  if (!estLongAssez || !contientLettre || !contientChiffre) {
    res.status(400).json({ message: 'Mot de passe invalide (min 6 caractères, lettre + chiffre).' });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const success = resetPasswordByToken(token, hashedPassword);

  if (!success) {
    res.status(400).json({ message: 'Token invalide ou expiré. Veuillez recommencer.' });
    return;
  }

  res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
}
export function envoyerMessage(req: Request, res: Response): void {
  const user = req.user;
  const { to, contenu } = req.body;

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  if (!to || !contenu) {
    res.status(400).json({ message: 'Destinataire et contenu requis.' });
    return;
  }

  const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
  const messages: any[] = fs.existsSync(messagesPath)
    ? JSON.parse(fs.readFileSync(messagesPath, 'utf-8'))
    : [];

  messages.push({
    id: messages.length > 0 ? messages[messages.length - 1].id + 1 : 1,
    from: user.id,
    to,
    contenu,
    date: new Date().toISOString()
  });

  fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf-8');
  res.status(201).json({ message: 'Message envoyé.' });
}
export function lireMessages(req: Request, res: Response): void {
  const user = req.user;
  const otherId = parseInt(req.params.userId);

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  if (isNaN(otherId)) {
    res.status(400).json({ message: 'ID utilisateur invalide.' });
    return;
  }

  const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
  const messages: any[] = fs.existsSync(messagesPath)
    ? JSON.parse(fs.readFileSync(messagesPath, 'utf-8'))
    : [];

  const conversation = messages.filter(m =>
    (m.from === user.id && parseInt(m.to) === otherId) ||
    (m.from === otherId && parseInt(m.to) === user.id)
  );

  const formatés = conversation.map(m => ({
    ...m,
    dateLisible: formatDateFr(m.date)
  }));
  res.status(200).json(formatés);
}

// Nouvelle fonction pour récupérer tous les messages d'un utilisateur
export function lireTousMessages(req: Request, res: Response): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
  const messages: any[] = fs.existsSync(messagesPath)
    ? JSON.parse(fs.readFileSync(messagesPath, 'utf-8'))
    : [];

  // Filtrer les messages où l'utilisateur est soit l'expéditeur soit le destinataire
  const userMessages = messages.filter(m =>
    m.from === user.id || parseInt(m.to) === user.id
  );

  // Trier les messages par date (du plus récent au plus ancien)
  const messagesTries = userMessages.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatés = messagesTries.map(m => ({
    ...m,
    dateLisible: formatDateFr(m.date)
  }));

  res.status(200).json(formatés);
}

export function compterNotificationsNonLues(req: Request, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  const notificationsPath = path.join(__dirname, '..', 'data', 'notifications.json');
  const notifications: any[] = fs.existsSync(notificationsPath)
    ? JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'))
    : [];

  const nonLues = notifications.filter(n => n.userId === user.id && !n.lu);
  res.status(200).json({ count: nonLues.length });
}
export function formatDateFr(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function updateProfil(req: Request, res: Response): void {
  const user = req.user;
  const { nom, email, date_naissance } = req.body;

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  // Récupérer l'utilisateur complet depuis la base de données
  const utilisateur = findUtilisateurByEmail(user.email);
  if (!utilisateur) {
    res.status(404).json({ message: 'Utilisateur non trouvé.' });
    return;
  }

  // Mettre à jour les champs
  utilisateur.nom = nom || utilisateur.nom;
  utilisateur.email = email || utilisateur.email;
  utilisateur.dateNaissance = date_naissance || utilisateur.dateNaissance;

  // Sauvegarder les modifications
  const utilisateurs = getAllUtilisateurs();
  const index = utilisateurs.findIndex(u => u.id === utilisateur.id);
  if (index !== -1) {
    utilisateurs[index] = utilisateur;
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'utilisateurs.json'), JSON.stringify(utilisateurs, null, 2));
  }

  res.status(200).json({
    message: 'Profil mis à jour avec succès',
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
      date_naissance: utilisateur.dateNaissance
    }
  });
}

export async function verifyPassword(req: Request, res: Response): Promise<void> {
    const user = req.user;
    const { currentPassword } = req.body;

    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }

    const utilisateur = findUtilisateurByEmail(user.email);
    if (!utilisateur) {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
        return;
    }

    const estValide = await bcrypt.compare(currentPassword, utilisateur.password);
    if (!estValide) {
        res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
        return;
    }

    res.status(200).json({ message: 'Mot de passe correct.' });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
    const user = req.user;
    const { newPassword } = req.body;

    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }

    // Validation du mot de passe
    const estLongAssez = newPassword.length >= 6;
    const contientLettre = /[a-zA-Z]/.test(newPassword);
    const contientChiffre = /\d/.test(newPassword);

    if (!estLongAssez || !contientLettre || !contientChiffre) {
        res.status(400).json({ 
            message: 'Le mot de passe doit contenir au moins 6 caractères, avec au moins une lettre et un chiffre.' 
        });
        return;
    }

    const utilisateur = findUtilisateurByEmail(user.email);
    if (!utilisateur) {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
        return;
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    utilisateur.password = hashedPassword;

    // Sauvegarder les modifications
    const utilisateurs = getAllUtilisateurs();
    const index = utilisateurs.findIndex(u => u.id === utilisateur.id);
    if (index !== -1) {
        utilisateurs[index] = utilisateur;
        fs.writeFileSync(path.join(__dirname, '..', 'data', 'utilisateurs.json'), JSON.stringify(utilisateurs, null, 2));
    }

    res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
}
