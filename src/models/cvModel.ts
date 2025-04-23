import fs from 'fs';
import path from 'path';

const cvFilePath = path.join(__dirname, '..', 'data', 'cvs.json');

// 1. Interface CV
export interface CV {
  id: number;
  utilisateurId: number;
  titre: string;
  competences: number[]; // tableau d’IDs de compétences
}

// 2. Chemin vers le fichier cvs.json
const filePath = path.join(__dirname, '..', 'data', 'cvs.json');

// 3. Fonction pour lire tous les CVs
export function getAllCVs(): CV[] {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const cvs: CV[] = JSON.parse(rawData);
  return cvs;
}
export function addCV(newCV: CV): void {
    const cvs = getAllCVs();
  
    // Générer un nouvel ID automatiquement
    const newId = cvs.length > 0 ? cvs[cvs.length - 1].id + 1 : 1;
    newCV.id = newId;
  
    cvs.push(newCV);
  
   
    fs.writeFileSync(filePath, JSON.stringify(cvs, null, 2), 'utf8');
  }
  export function deleteCVsByUtilisateurId(utilisateurId: number): void {
    const cvs = getAllCVs();
  
    // Garder seulement les CVs qui n'appartiennent pas à cet utilisateur
    const updated = cvs.filter(cv => cv.utilisateurId !== utilisateurId);
  
   
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  }
  export function removeCompetenceFromCVs(competenceId: number): void {
    const cvs = getAllCVs();
  
    // Pour chaque CV, retirer l'ID de compétence s'il est présent
    const updated = cvs.map(cv => ({
      ...cv,
      competences: cv.competences.filter(id => id !== competenceId)
    }));
  
   
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  }

export function saveCVs(cvs: CV[]): void {
  fs.writeFileSync(cvFilePath, JSON.stringify(cvs, null, 2), 'utf-8');
}
