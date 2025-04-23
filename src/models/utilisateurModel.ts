import fs from 'fs';
import path from 'path';

// 1. Interface Utilisateur
export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: 'candidat' | 'recruteur' | 'admin';
  password: string;
}

// 2. Chemin vers le fichier JSON
const filePath = path.join(__dirname, '..', 'data', 'utilisateurs.json');

// 3. Fonction pour lire tous les utilisateurs
export function getAllUtilisateurs(): Utilisateur[] {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const utilisateurs: Utilisateur[] = JSON.parse(rawData);
  return utilisateurs;
}
export function addUtilisateur(newUtilisateur: Utilisateur): void {
    const utilisateurs = getAllUtilisateurs(); // lire les existants
  
    // Générer un nouvel id automatiquement
    const newId = utilisateurs.length > 0 ? utilisateurs[utilisateurs.length - 1].id + 1 : 1;
    newUtilisateur.id = newId;
  
    utilisateurs.push(newUtilisateur); // ajouter le nouveau
  
    // Réécrire dans le fichier JSON
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
  }
  export function deleteUtilisateur(id: number): void {
    const utilisateurs = getAllUtilisateurs();
  
    const updated = utilisateurs.filter(u => u.id !== id);
  
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  }
  export function findUtilisateurByEmail(email: string): Utilisateur | undefined {
    const utilisateurs = getAllUtilisateurs();
    return utilisateurs.find(u => u.email === email);
  }
  