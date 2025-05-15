"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCompetences = getAllCompetences;
exports.addCompetence = addCompetence;
exports.deleteCompetence = deleteCompetence;
const cvModel_1 = require("../models/cvModel");
const competenceModel_1 = require("../models/competenceModel");
// Récupérer toutes les compétences
function getAllCompetences(req, res) {
    const competences = (0, competenceModel_1.getAllCompetences)();
    res.status(200).json(competences);
}
// Ajouter une nouvelle compétence
function addCompetence(req, res) {
    const { nom } = req.body;
    if (!nom || typeof nom !== 'string') {
        res.status(400).json({ message: 'Le nom de la compétence est requis.' });
        return;
    }
    const nouvelleCompetence = {
        id: 0, // L'ID sera généré par le modèle
        nom: nom
    };
    (0, competenceModel_1.addCompetence)(nouvelleCompetence);
    res.status(201).json(nouvelleCompetence);
}
// Supprimer une compétence
function deleteCompetence(req, res) {
    const competenceId = parseInt(req.params.id);
    if (isNaN(competenceId)) {
        res.status(400).json({ message: 'ID de compétence invalide.' });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    let modified = false;
    // Supprimer la compétence de tous les CVs
    cvs.forEach(cv => {
        if (Array.isArray(cv.competences)) {
            const originalLength = cv.competences.length;
            cv.competences = cv.competences.filter(comp => comp !== competenceId);
            if (cv.competences.length !== originalLength) {
                modified = true;
            }
        }
    });
    if (modified) {
        (0, cvModel_1.saveCVs)(cvs);
        (0, competenceModel_1.deleteCompetence)(competenceId);
        res.status(200).json({ message: 'Compétence supprimée avec succès' });
    }
    else {
        res.status(404).json({ message: 'Compétence non trouvée' });
    }
}
