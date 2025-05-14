import fs from 'fs';
import path from 'path';

// 1. Interface Utilisateur
export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: 'candidat' | 'recruteur' | 'admin';
  password: string;
  actif: boolean;
  entreprise?: string;
  siret?: string;
  dateNaissance?: string;
  resetToken?: string;
  resetTokenExpiration?: string;
  date_inscription: string; // Date d'inscription de l'utilisateur
}

// 2. Chemin vers le fichier JSON
const filePath = path.join(__dirname, '..', 'data', 'utilisateurs.json');

// 3. Fonction pour lire tous les utilisateurs
export function getAllUtilisateurs(): Utilisateur[] {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    let utilisateurs: Utilisateur[] = JSON.parse(rawData);

    const now = new Date();

    // Nettoyer les tokens expirés
    let modifié = false;
    utilisateurs = utilisateurs.map(u => {
      if (u.resetToken && u.resetTokenExpiration && new Date(u.resetTokenExpiration) < now) {
        modifié = true;
        return { ...u, resetToken: undefined, resetTokenExpiration: undefined };
      }
      return u;
    });

    if (modifié) {
      fs.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf-8');
    }

    return utilisateurs;
  } catch (error) {
    console.error('Erreur lecture fichier utilisateurs:', error);
    return [];
  }
}

// Ajouter un utilisateur
export function addUtilisateur(newUtilisateur: Utilisateur): Utilisateur {
  const utilisateurs = getAllUtilisateurs();
  const newId = utilisateurs.length > 0 ? utilisateurs[utilisateurs.length - 1].id + 1 : 1;
  newUtilisateur.id = newId;

  utilisateurs.push(newUtilisateur);
  fs.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
  return newUtilisateur;
}

// Supprimer un utilisateur
export function deleteUtilisateur(id: number): void {
  const utilisateurs = getAllUtilisateurs();
  const updated = utilisateurs.filter(u => u.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
}

// Trouver par email
export function findUtilisateurByEmail(email: string): Utilisateur | undefined {
  const utilisateurs = getAllUtilisateurs();
  return utilisateurs.find(u => u.email === email);
}

// Activer/désactiver un utilisateur
export function toggleStatutUtilisateur(id: number, actif: boolean): boolean {
  const utilisateurs = getAllUtilisateurs();
  const index = utilisateurs.findIndex(u => u.id === id);
  if (index === -1) return false;

  utilisateurs[index].actif = actif;
  fs.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
  return true;
}

// Définir un token de réinitialisation
export function setResetToken(email: string, token: string, expiration: string): boolean {
  const utilisateurs = getAllUtilisateurs();
  const index = utilisateurs.findIndex(u => u.email === email);
  if (index === -1) return false;

  utilisateurs[index].resetToken = token;
  utilisateurs[index].resetTokenExpiration = expiration;

  fs.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
  return true;
}

// Réinitialiser un mot de passe par token
export function resetPasswordByToken(token: string, hashedPassword: string): boolean {
  const utilisateurs = getAllUtilisateurs();
  const now = new Date();

  const index = utilisateurs.findIndex(u =>
    u.resetToken === token &&
    u.resetTokenExpiration &&
    new Date(u.resetTokenExpiration) > now
  );

  if (index === -1) return false;

  utilisateurs[index].password = hashedPassword;
  utilisateurs[index].resetToken = undefined;
  utilisateurs[index].resetTokenExpiration = undefined;

  fs.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
  return true;
}
