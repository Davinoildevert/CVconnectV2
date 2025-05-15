"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCompetences = getAllCompetences;
exports.addCompetence = addCompetence;
exports.deleteCompetence = deleteCompetence;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 2. Chemin vers le fichier JSON
const filePath = path_1.default.join(__dirname, '..', 'data', 'competences.json');
// 3. Fonction pour lire toutes les compétences
function getAllCompetences() {
    try {
        const rawData = fs_1.default.readFileSync(filePath, 'utf8');
        const competences = JSON.parse(rawData);
        return competences;
    }
    catch (error) {
        console.error('Erreur lecture fichier utilisateurs:', error);
        return [];
    }
}
function addCompetence(newCompetence) {
    const competences = getAllCompetences();
    // Générer un nouvel ID automatiquement
    const newId = competences.length > 0 ? competences[competences.length - 1].id + 1 : 1;
    newCompetence.id = newId;
    competences.push(newCompetence);
    // Écrire le nouveau tableau dans le fichier JSON
    fs_1.default.writeFileSync(filePath, JSON.stringify(competences, null, 2), 'utf8');
}
function deleteCompetence(id) {
    const competences = getAllCompetences();
    const updated = competences.filter(c => c.id !== id);
    fs_1.default.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
}
