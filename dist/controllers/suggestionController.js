"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestions = getSuggestions;
exports.createSuggestion = createSuggestion;
exports.updateStatus = updateStatus;
const suggestionModel_1 = require("../models/suggestionModel");
// GET /admin/suggestions
function getSuggestions(req, res) {
    try {
        const suggestions = (0, suggestionModel_1.getAllSuggestions)();
        res.status(200).json(suggestions);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des suggestions' });
    }
}
// POST /suggestions
function createSuggestion(req, res) {
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
        const suggestion = (0, suggestionModel_1.addSuggestion)({
            type: type,
            titre,
            contenu,
            utilisateur: {
                id: user.id,
                nom: user.nom,
                role: user.role
            }
        });
        res.status(201).json(suggestion);
    }
    catch (error) {
        console.error('Erreur lors de la création de la suggestion:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la suggestion' });
    }
}
// PATCH /admin/suggestions/:id/status
function updateStatus(req, res) {
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
        const updatedSuggestion = (0, suggestionModel_1.updateSuggestionStatus)(id, statut);
        if (!updatedSuggestion) {
            res.status(404).json({ message: 'Suggestion non trouvée' });
            return;
        }
        res.status(200).json(updatedSuggestion);
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
    }
}
