import { Request, Response } from 'express';
import { getAllSuggestions, addSuggestion, updateSuggestionStatus } from '../models/suggestionModel';

// Type de suggestion
interface Suggestion {
  id: number;
  fromUserId: number;
  contenu: string;
  type: 'competence' | 'fonctionnalite' | 'autre';
  date: string;
}

// GET /admin/suggestions
export function getSuggestions(req: Request, res: Response): void {
    try {
        const suggestions = getAllSuggestions();
        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des suggestions' });
    }
}

// POST /suggestions
export function createSuggestion(req: Request, res: Response): void {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "Non authentifié." });
            return;
        }

        const { type, titre, contenu } = req.body;
        if (!type || !titre || !contenu) {
            res.status(400).json({ message: 'Tous les champs sont requis' });
            return;
        }

        // Vérifier que le type est valide
        if (!['competence', 'fonctionnalite', 'autre'].includes(type)) {
            res.status(400).json({ message: 'Type de suggestion invalide' });
            return;
        }

        const suggestion = addSuggestion({
            type: type as 'competence' | 'fonctionnalite' | 'autre',
            titre,
            contenu,
            utilisateur: {
                id: user.id,
                nom: user.nom,
                role: user.role as 'candidat' | 'recruteur'
            }
        });

        res.status(201).json(suggestion);
    } catch (error) {
        console.error('Erreur lors de la création de la suggestion:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la suggestion' });
    }
}

// PATCH /admin/suggestions/:id/status
export function updateStatus(req: Request, res: Response): void {
    try {
        const id = parseInt(req.params.id);
        const { statut } = req.body;

        if (isNaN(id) || !statut) {
            res.status(400).json({ message: 'ID et statut requis' });
            return;
        }

        // Vérifier que le statut est valide
        if (!['en_attente', 'en_cours', 'terminee', 'rejetee'].includes(statut)) {
            res.status(400).json({ message: 'Statut invalide' });
            return;
        }

        const updatedSuggestion = updateSuggestionStatus(id, statut as 'en_attente' | 'en_cours' | 'terminee' | 'rejetee');
        if (!updatedSuggestion) {
            res.status(404).json({ message: 'Suggestion non trouvée' });
            return;
        }

        res.status(200).json(updatedSuggestion);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
    }
}
