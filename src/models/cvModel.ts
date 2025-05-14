import fs from 'fs';
import path from 'path';

// 1. Interface CV enrichie
export interface CV {
  id: number;
  utilisateurId: number;
  titre: string;
  competences: number[];
  formations?: string[];
  experiences?: string[];
  softskills?: string[];
  langues?: string[];
  photo?: string;        // Chemin de la photo (ex: /uploads/...)
  description?: string;
  telephone?: string;  // ✅
  adresse?: string;    // ✅ 
  style?: string;      // Style du CV (classique, moderne, etc.)
}

// 2. Chemin vers le fichier JSON
const cvFilePath = path.join(__dirname, '..', 'data', 'cvs.json');

// 3. Lire tous les CVs
export function getAllCVs(): CV[] {
  try {
    const rawData = fs.readFileSync(cvFilePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('[CV MODEL] Erreur de lecture cvs.json:', error);
    return [];
  }
}

// 4. Ajouter un CV
export function addCV(newCV: CV): void {
  const cvs = getAllCVs();
  const newId = cvs.length > 0 ? cvs[cvs.length - 1].id + 1 : 1;
  newCV.id = newId;

  cvs.push(newCV);
  fs.writeFileSync(cvFilePath, JSON.stringify(cvs, null, 2), 'utf8');
}

// 5. Supprimer tous les CVs d'un utilisateur
export function deleteCVsByUtilisateurId(utilisateurId: number): void {
  const cvs = getAllCVs();
  const updated = cvs.filter(cv => cv.utilisateurId !== utilisateurId);
  fs.writeFileSync(cvFilePath, JSON.stringify(updated, null, 2), 'utf8');
}

// 6. Supprimer une compétence dans tous les CVs
export function removeCompetenceFromCVs(competenceId: number): void {
  const cvs = getAllCVs();
  const updated = cvs.map(cv => ({
    ...cv,
    competences: cv.competences.filter(id => id !== competenceId)
  }));
  fs.writeFileSync(cvFilePath, JSON.stringify(updated, null, 2), 'utf8');
}

// 7. Sauvegarder la totalité des CVs
export function saveCVs(cvs: CV[]): void {
  fs.writeFileSync(cvFilePath, JSON.stringify(cvs, null, 2), 'utf-8');
}

// 8. Récupérer les CVs d'un utilisateur
export function getCVsByUtilisateurId(utilisateurId: number): CV[] {
  return getAllCVs().filter(cv => cv.utilisateurId === utilisateurId);
}
