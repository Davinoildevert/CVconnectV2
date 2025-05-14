import fs from 'fs';
import path from 'path';

// 1. Interface pour structurer une compétence
export interface Competence {
  id: number;
  nom: string;
}

// 2. Chemin vers le fichier JSON
const filePath = path.join(__dirname, '..', 'data', 'competences.json');

// 3. Fonction pour lire toutes les compétences
export function getAllCompetences(): Competence[] {
  try{
  const rawData = fs.readFileSync(filePath, 'utf8');
  const competences: Competence[] = JSON.parse(rawData);
  return competences;
} catch (error) {
  console.error('Erreur lecture fichier utilisateurs:', error);
  return [];
}
}
export function addCompetence(newCompetence: Competence): void {
    const competences = getAllCompetences();
  
    // Générer un nouvel ID automatiquement
    const newId = competences.length > 0 ? competences[competences.length - 1].id + 1 : 1;
    newCompetence.id = newId;
  
    competences.push(newCompetence);
  
    // Écrire le nouveau tableau dans le fichier JSON
    
    fs.writeFileSync(filePath, JSON.stringify(competences, null, 2), 'utf8');
  }
  export function deleteCompetence(id: number): void {
    const competences = getAllCompetences();
  
    const updated = competences.filter(c => c.id !== id);
  
    
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  }
  