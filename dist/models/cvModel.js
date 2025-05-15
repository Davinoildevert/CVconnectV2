"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCVs = getAllCVs;
exports.addCV = addCV;
exports.deleteCVsByUtilisateurId = deleteCVsByUtilisateurId;
exports.removeCompetenceFromCVs = removeCompetenceFromCVs;
exports.saveCVs = saveCVs;
exports.getCVsByUtilisateurId = getCVsByUtilisateurId;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 2. Chemin vers le fichier JSON
const cvFilePath = path_1.default.join(__dirname, '..', 'data', 'cvs.json');
// 3. Lire tous les CVs
function getAllCVs() {
    try {
        const rawData = fs_1.default.readFileSync(cvFilePath, 'utf8');
        return JSON.parse(rawData);
    }
    catch (error) {
        console.error('[CV MODEL] Erreur de lecture cvs.json:', error);
        return [];
    }
}
// 4. Ajouter un CV
function addCV(newCV) {
    const cvs = getAllCVs();
    const newId = cvs.length > 0 ? cvs[cvs.length - 1].id + 1 : 1;
    newCV.id = newId;
    cvs.push(newCV);
    fs_1.default.writeFileSync(cvFilePath, JSON.stringify(cvs, null, 2), 'utf8');
}
// 5. Supprimer tous les CVs d'un utilisateur
function deleteCVsByUtilisateurId(utilisateurId) {
    const cvs = getAllCVs();
    const updated = cvs.filter(cv => cv.utilisateurId !== utilisateurId);
    fs_1.default.writeFileSync(cvFilePath, JSON.stringify(updated, null, 2), 'utf8');
}
// 6. Supprimer une compétence dans tous les CVs
function removeCompetenceFromCVs(competenceId) {
    const cvs = getAllCVs();
    const updated = cvs.map(cv => (Object.assign(Object.assign({}, cv), { competences: cv.competences.filter(id => id !== competenceId) })));
    fs_1.default.writeFileSync(cvFilePath, JSON.stringify(updated, null, 2), 'utf8');
}
// 7. Sauvegarder la totalité des CVs
function saveCVs(cvs) {
    fs_1.default.writeFileSync(cvFilePath, JSON.stringify(cvs, null, 2), 'utf-8');
}
// 8. Récupérer les CVs d'un utilisateur
function getCVsByUtilisateurId(utilisateurId) {
    return getAllCVs().filter(cv => cv.utilisateurId === utilisateurId);
}
