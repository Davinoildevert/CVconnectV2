"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSuggestions = getAllSuggestions;
exports.saveSuggestions = saveSuggestions;
exports.addSuggestion = addSuggestion;
exports.updateSuggestionStatus = updateSuggestionStatus;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Chemin vers le fichier JSON
const SUGGESTIONS_FILE = path_1.default.join(__dirname, '../../data/suggestions.json');
// Fonction pour lire les suggestions
function getAllSuggestions() {
    try {
        if (!fs_1.default.existsSync(SUGGESTIONS_FILE)) {
            // Si le fichier n'existe pas, on le crée avec un tableau vide
            fs_1.default.writeFileSync(SUGGESTIONS_FILE, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs_1.default.readFileSync(SUGGESTIONS_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Erreur lors de la lecture des suggestions:', error);
        return [];
    }
}
// Fonction pour sauvegarder les suggestions
function saveSuggestions(suggestions) {
    try {
        fs_1.default.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
    }
    catch (error) {
        console.error('Erreur lors de la sauvegarde des suggestions:', error);
        throw new Error('Erreur lors de la sauvegarde des suggestions');
    }
}
// Fonction pour ajouter une suggestion
function addSuggestion(suggestion) {
    const suggestions = getAllSuggestions();
    const newSuggestion = Object.assign(Object.assign({}, suggestion), { id: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.id)) + 1 : 1, date: new Date().toISOString(), statut: 'en_attente' });
    suggestions.push(newSuggestion);
    saveSuggestions(suggestions);
    return newSuggestion;
}
// Fonction pour mettre à jour le statut d'une suggestion
function updateSuggestionStatus(id, newStatus) {
    const suggestions = getAllSuggestions();
    const index = suggestions.findIndex(s => s.id === id);
    if (index === -1)
        return null;
    suggestions[index].statut = newStatus;
    saveSuggestions(suggestions);
    return suggestions[index];
}
