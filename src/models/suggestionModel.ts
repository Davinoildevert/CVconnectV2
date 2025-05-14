import fs from 'fs';
import path from 'path';

// Types
export interface Suggestion {
    id: number;
    type: 'competence' | 'fonctionnalite' | 'autre';
    titre: string;
    contenu: string;
    date: string;
    statut: 'en_attente' | 'en_cours' | 'terminee' | 'rejetee';
    utilisateur: {
        id: number;
        nom: string;
        role: 'candidat' | 'recruteur';
    };
}

// Chemin vers le fichier JSON
const SUGGESTIONS_FILE = path.join(__dirname, '../../data/suggestions.json');

// Fonction pour lire les suggestions
export function getAllSuggestions(): Suggestion[] {
    try {
        if (!fs.existsSync(SUGGESTIONS_FILE)) {
            // Si le fichier n'existe pas, on le crée avec un tableau vide
            fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs.readFileSync(SUGGESTIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture des suggestions:', error);
        return [];
    }
}

// Fonction pour sauvegarder les suggestions
export function saveSuggestions(suggestions: Suggestion[]): void {
    try {
        fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des suggestions:', error);
        throw new Error('Erreur lors de la sauvegarde des suggestions');
    }
}

// Fonction pour ajouter une suggestion
export function addSuggestion(suggestion: Omit<Suggestion, 'id' | 'date' | 'statut'>): Suggestion {
    const suggestions = getAllSuggestions();
    const newSuggestion: Suggestion = {
        ...suggestion,
        id: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.id)) + 1 : 1,
        date: new Date().toISOString(),
        statut: 'en_attente'
    };
    suggestions.push(newSuggestion);
    saveSuggestions(suggestions);
    return newSuggestion;
}

// Fonction pour mettre à jour le statut d'une suggestion
export function updateSuggestionStatus(id: number, newStatus: Suggestion['statut']): Suggestion | null {
    const suggestions = getAllSuggestions();
    const index = suggestions.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    suggestions[index].statut = newStatus;
    saveSuggestions(suggestions);
    return suggestions[index];
}
