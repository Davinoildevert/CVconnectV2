"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdminDev = loginAdminDev;
exports.getTousUtilisateurs = getTousUtilisateurs;
exports.getTousCVs = getTousCVs;
exports.supprimerUtilisateurParAdmin = supprimerUtilisateurParAdmin;
exports.supprimerCVParAdmin = supprimerCVParAdmin;
exports.changerStatutUtilisateur = changerStatutUtilisateur;
exports.getStats = getStats;
exports.getCVDetails = getCVDetails;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../configs/jwt.config");
const utilisateurModel_1 = require("../models/utilisateurModel");
const cvModel_1 = require("../models/cvModel");
const competenceModel_1 = require("../models/competenceModel");
const utilisateurModel_2 = require("../models/utilisateurModel");
const cvModel_2 = require("../models/cvModel");
const utilisateurModel_3 = require("../models/utilisateurModel");
function loginAdminDev(req, res) {
    const { key } = req.body;
    // Vérifie que la clé est envoyée
    if (!key) {
        res.status(400).json({ message: 'Clé requise pour accéder.' });
        return;
    }
    // Compare avec la clé du .env
    if (key !== process.env.ADMIN_SECRET_KEY) {
        res.status(401).json({ message: 'Clé invalide. Accès refusé.' });
        return;
    }
    // Si la clé est correcte, on crée un token admin
    const adminToken = jsonwebtoken_1.default.sign({
        id: 0,
        nom: 'Admin Dev',
        email: 'admin@cvconnect.com',
        role: 'admin'
    }, jwt_config_1.SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({
        message: 'Connexion admin réussie',
        token: adminToken
    });
}
//  GET /admin/utilisateurs → Liste complète
function getTousUtilisateurs(req, res) {
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    res.status(200).json(utilisateurs);
}
//  GET /admin/cvs → liste complète
function getTousCVs(req, res) {
    const cvs = (0, cvModel_1.getAllCVs)();
    const competences = (0, competenceModel_1.getAllCompetences)();
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    const mapCompetences = new Map();
    competences.forEach(c => mapCompetences.set(c.id, c.nom));
    const mapUtilisateurs = new Map();
    utilisateurs.forEach(u => {
        mapUtilisateurs.set(u.id, {
            nom: u.nom,
            email: u.email,
            role: u.role
        });
    });
    const cvsAvecInfos = cvs.map(cv => ({
        id: cv.id,
        titre: cv.titre,
        utilisateur: mapUtilisateurs.get(cv.utilisateurId) || {},
        competences: cv.competences.map(id => {
            const numId = typeof id === 'string' ? parseInt(id) : id;
            return mapCompetences.get(numId) || 'Inconnue';
        })
    }));
    res.status(200).json(cvsAvecInfos);
}
function supprimerUtilisateurParAdmin(req, res) {
    const utilisateurId = parseInt(req.params.id);
    if (isNaN(utilisateurId)) {
        res.status(400).json({ message: 'ID invalide.' });
        return;
    }
    // Supprimer d'abord les CVs liés
    (0, cvModel_2.deleteCVsByUtilisateurId)(utilisateurId);
    // Puis supprimer l'utilisateur
    (0, utilisateurModel_2.deleteUtilisateur)(utilisateurId);
    res.status(200).json({ message: 'Utilisateur et CVs associés supprimés.' });
}
function supprimerCVParAdmin(req, res) {
    const cvId = parseInt(req.params.id);
    if (isNaN(cvId)) {
        res.status(400).json({ message: 'ID de CV invalide.' });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    const index = cvs.findIndex(cv => cv.id === cvId);
    if (index === -1) {
        res.status(404).json({ message: 'CV non trouvé.' });
        return;
    }
    cvs.splice(index, 1); // Supprime le CV
    (0, cvModel_1.saveCVs)(cvs); // Sauvegarde le fichier
    res.status(200).json({ message: 'CV supprimé avec succès.' });
}
function changerStatutUtilisateur(req, res) {
    const utilisateurId = parseInt(req.params.id);
    const { actif } = req.body;
    if (isNaN(utilisateurId) || typeof actif !== "boolean") {
        res.status(400).json({ message: 'Requête invalide.' });
        return;
    }
    const ok = (0, utilisateurModel_3.toggleStatutUtilisateur)(utilisateurId, actif);
    if (!ok) {
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return;
    }
    res.status(200).json({ message: `Utilisateur ${actif ? 'réactivé' : 'suspendu'} avec succès.` });
}
function getStats(req, res) {
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    const cvs = (0, cvModel_1.getAllCVs)();
    const competences = (0, competenceModel_1.getAllCompetences)();
    const stats = {
        totalUtilisateurs: utilisateurs.length,
        totalCandidats: utilisateurs.filter(u => u.role === 'candidat').length,
        totalRecruteurs: utilisateurs.filter(u => u.role === 'recruteur').length,
        totalCVs: cvs.length,
        totalCompetences: competences.length
    };
    res.status(200).json(stats);
}
function getCVDetails(req, res) {
    const cvId = parseInt(req.params.id);
    if (isNaN(cvId)) {
        res.status(400).json({ message: 'ID de CV invalide.' });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    const cv = cvs.find(c => c.id === cvId);
    if (!cv) {
        res.status(404).json({ message: 'CV non trouvé.' });
        return;
    }
    // Récupérer les informations de l'utilisateur
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    const utilisateur = utilisateurs.find(u => u.id === cv.utilisateurId);
    // Récupérer les noms des compétences
    const competences = (0, competenceModel_1.getAllCompetences)();
    const mapCompetences = new Map();
    competences.forEach(c => mapCompetences.set(c.id, c.nom));
    // Construire la réponse avec toutes les informations
    const cvDetails = Object.assign(Object.assign({}, cv), { utilisateur: utilisateur ? {
            nom: utilisateur.nom,
            email: utilisateur.email,
            role: utilisateur.role
        } : null, competences: cv.competences.map(id => {
            const numId = typeof id === 'string' ? parseInt(id) : id;
            return mapCompetences.get(numId) || 'Inconnue';
        }) });
    res.status(200).json(cvDetails);
}
