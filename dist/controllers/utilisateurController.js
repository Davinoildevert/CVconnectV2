"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.afficherUtilisateurs = afficherUtilisateurs;
exports.ajouterUtilisateur = ajouterUtilisateur;
exports.supprimerUtilisateur = supprimerUtilisateur;
exports.loginUtilisateur = loginUtilisateur;
exports.getProfilConnecte = getProfilConnecte;
exports.demanderResetPassword = demanderResetPassword;
exports.reinitialiserPassword = reinitialiserPassword;
exports.envoyerMessage = envoyerMessage;
exports.lireMessages = lireMessages;
exports.lireTousMessages = lireTousMessages;
exports.compterNotificationsNonLues = compterNotificationsNonLues;
exports.compterMessagesNonLus = compterMessagesNonLus;
exports.formatDateFr = formatDateFr;
exports.updateProfil = updateProfil;
exports.verifyPassword = verifyPassword;
exports.changePassword = changePassword;
const utilisateurModel_1 = require("../models/utilisateurModel");
const cvModel_1 = require("../models/cvModel");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../configs/jwt.config"); // ← On va le créer juste après
const utilisateurModel_2 = require("../models/utilisateurModel");
const uuid_1 = require("uuid"); // Génère des tokens uniques
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
//  Fonction pour répondre à GET /utilisateurs
function afficherUtilisateurs(req, res) {
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    res.json(utilisateurs);
}
function ajouterUtilisateur(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { nom, email, role, password, titreCV, competences, entreprise, siret, dateNaissance } = req.body;
        if ((0, utilisateurModel_1.findUtilisateurByEmail)(email)) {
            res.status(409).json({ message: "Un compte existe déjà avec cet email." });
            return;
        }
        if (role === 'recruteur' && (!entreprise || !siret)) {
            res.status(400).json({ message: "Les recruteurs doivent fournir le nom de l'entreprise et le numéro SIRET." });
            return;
        }
        if (role === 'recruteur' && !/^\d+$/.test(siret)) {
            res.status(400).json({ message: 'Le numéro SIRET doit contenir uniquement des chiffres.' });
            return;
        }
        //  Vérification des champs de base
        if (!nom || !email || !role || !password) {
            res.status(400).json({ message: 'Nom, email, rôle et mot de passe requis.' });
            return;
        }
        if (role === 'candidat') {
            if (!dateNaissance) {
                res.status(400).json({ message: 'La date de naissance est requise pour les candidats.' });
                return;
            }
            const naissance = new Date(dateNaissance);
            const now = new Date();
            let age = now.getFullYear() - naissance.getFullYear();
            const m = now.getMonth() - naissance.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < naissance.getDate())) {
                age--;
            }
            if (age < 16) {
                res.status(400).json({ message: 'Vous devez avoir au moins 16 ans pour vous inscrire.' });
                return;
            }
        }
        // Ajout de la validation du mot de passe
        const estLongAssez = password.length >= 6;
        const contientLettre = /[a-zA-Z]/.test(password);
        const contientChiffre = /\d/.test(password);
        if (!estLongAssez || !contientLettre || !contientChiffre) {
            res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères, avec au moins une lettre et un chiffre.' });
            return;
        }
        if (role !== 'candidat' && role !== 'recruteur') {
            res.status(400).json({ message: 'Rôle non autorisé.' });
            return;
        }
        // Vérification : si un CV doit être généré, il faut un titre et des compétences
        if ((titreCV && !Array.isArray(competences)) || (competences && !titreCV)) {
            res.status(400).json({ message: 'Pour générer un CV automatiquement, fournissez "titreCV" et "competences".' });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        //  Création de l'utilisateur (ID généré dans le modèle)
        const nouvelUtilisateur = {
            id: 0,
            nom,
            email,
            role,
            password: hashedPassword,
            actif: true,
            entreprise,
            siret,
            dateNaissance,
            date_inscription: new Date().toISOString()
        };
        const utilisateurCree = (0, utilisateurModel_1.addUtilisateur)(nouvelUtilisateur);
        // Génération automatique du CV si demandé
        if (titreCV && Array.isArray(competences)) {
            const nouveauCV = {
                id: 0,
                utilisateurId: utilisateurCree.id,
                titre: titreCV,
                competences
            };
            const utilisateurs = require('../models/utilisateurModel').getAllUtilisateurs();
            const lastUtilisateur = utilisateurs[utilisateurs.length - 1];
            nouveauCV.utilisateurId = lastUtilisateur.id;
            (0, cvModel_1.addCV)(nouveauCV);
        }
        res.status(201).json({ message: 'Utilisateur (et CV si fourni) ajouté avec succès.' });
    });
}
//  Fonction DELETE /utilisateurs/:id
function supprimerUtilisateur(req, res) {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (isNaN(id)) {
        res.status(400).json({ message: 'ID invalide.' });
        return;
    }
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    //  Vérifie que l'utilisateur connecté correspond à l'ID
    if (user.role !== 'candidat' || user.id !== id) {
        res.status(403).json({ message: 'Vous ne pouvez supprimer que votre propre compte.' });
        return;
    }
    //  Effet cascade : supprimer les CV liés
    (0, cvModel_1.deleteCVsByUtilisateurId)(id);
    //  Supprimer l'utilisateur
    (0, utilisateurModel_1.deleteUtilisateur)(id);
    res.json({ message: 'Utilisateur et CVs associés supprimés.' });
}
//  Fonction pour POST /login
function loginUtilisateur(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email et mot de passe requis.' });
            return;
        }
        const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(email);
        if (!utilisateur) {
            res.status(401).json({ message: 'Identifiants invalides.' });
            return;
        }
        // Vérifier si le compte est actif
        if (!utilisateur.actif) {
            res.status(403).json({
                message: 'Votre compte a été désactivé par un administrateur. Veuillez contacter le support pour plus d\'informations.'
            });
            return;
        }
        const estValide = yield bcryptjs_1.default.compare(password, utilisateur.password);
        if (!estValide) {
            res.status(401).json({ message: 'Mot de passe incorrect.' });
            return;
        }
        // Standardiser le rôle
        const role = utilisateur.role === 'recruteur' ? 'recruteur' : utilisateur.role;
        // Créer un token avec le rôle standardisé
        const token = jsonwebtoken_1.default.sign({
            id: utilisateur.id,
            nom: utilisateur.nom,
            email: utilisateur.email,
            role: role
        }, jwt_config_1.SECRET_KEY, { expiresIn: '1h' });
        // Retourner le token dans la réponse
        res.status(200).json({
            message: 'Connexion réussie',
            token,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role: role,
                entreprise: utilisateur.entreprise,
                siret: utilisateur.siret
            }
        });
    });
}
function getProfilConnecte(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    // Récupérer l'utilisateur complet depuis la base de données
    const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(user.email);
    if (!utilisateur) {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
        return;
    }
    res.status(200).json({
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        date_naissance: utilisateur.dateNaissance
    });
}
function demanderResetPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email requis.' });
        return;
    }
    const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(email);
    if (!utilisateur) {
        res.status(404).json({ message: 'Aucun compte associé à cet email.' });
        return;
    }
    const token = (0, uuid_1.v4)();
    const expiration = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute
    (0, utilisateurModel_2.setResetToken)(email, token, expiration);
    res.status(200).json({
        message: 'Lien de réinitialisation généré',
        resetLink: `http://localhost:3000/reset-password/${token}`
    });
}
function reinitialiserPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = req.params;
        const { newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
            return;
        }
        const estLongAssez = newPassword.length >= 6;
        const contientLettre = /[a-zA-Z]/.test(newPassword);
        const contientChiffre = /\d/.test(newPassword);
        if (!estLongAssez || !contientLettre || !contientChiffre) {
            res.status(400).json({ message: 'Mot de passe invalide (min 6 caractères, lettre + chiffre).' });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        const success = (0, utilisateurModel_2.resetPasswordByToken)(token, hashedPassword);
        if (!success) {
            res.status(400).json({ message: 'Token invalide ou expiré. Veuillez recommencer.' });
            return;
        }
        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
    });
}
function envoyerMessage(req, res) {
    const user = req.user;
    const { to, contenu } = req.body;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (!to || !contenu) {
        res.status(400).json({ message: 'Destinataire et contenu requis.' });
        return;
    }
    const messagesPath = path_1.default.join(__dirname, '..', 'data', 'messages.json');
    const messages = fs_1.default.existsSync(messagesPath)
        ? JSON.parse(fs_1.default.readFileSync(messagesPath, 'utf-8'))
        : [];
    messages.push({
        id: messages.length > 0 ? messages[messages.length - 1].id + 1 : 1,
        from: user.id,
        to,
        contenu,
        date: new Date().toISOString(),
        lu: false
    });
    fs_1.default.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf-8');
    res.status(201).json({ message: 'Message envoyé.' });
}
function lireMessages(req, res) {
    const user = req.user;
    const otherId = parseInt(req.params.userId);
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (isNaN(otherId)) {
        res.status(400).json({ message: 'ID utilisateur invalide.' });
        return;
    }
    const messagesPath = path_1.default.join(__dirname, '..', 'data', 'messages.json');
    const messages = fs_1.default.existsSync(messagesPath)
        ? JSON.parse(fs_1.default.readFileSync(messagesPath, 'utf-8'))
        : [];
    const conversation = messages.filter(m => (m.from === user.id && parseInt(m.to) === otherId) ||
        (m.from === otherId && parseInt(m.to) === user.id));
    const formatés = conversation.map(m => (Object.assign(Object.assign({}, m), { dateLisible: formatDateFr(m.date) })));
    res.status(200).json(formatés);
}
// Nouvelle fonction pour récupérer tous les messages d'un utilisateur
function lireTousMessages(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    const messagesPath = path_1.default.join(__dirname, '..', 'data', 'messages.json');
    const messages = fs_1.default.existsSync(messagesPath)
        ? JSON.parse(fs_1.default.readFileSync(messagesPath, 'utf-8'))
        : [];
    // Filtrer les messages où l'utilisateur est soit l'expéditeur soit le destinataire
    const userMessages = messages.filter(m => m.from === user.id || parseInt(m.to) === user.id);
    // Trier les messages par date (du plus récent au plus ancien)
    const messagesTries = userMessages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const formatés = messagesTries.map(m => (Object.assign(Object.assign({}, m), { dateLisible: formatDateFr(m.date) })));
    res.status(200).json(formatés);
}
function compterNotificationsNonLues(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    const notificationsPath = path_1.default.join(__dirname, '..', 'data', 'notifications.json');
    const notifications = fs_1.default.existsSync(notificationsPath)
        ? JSON.parse(fs_1.default.readFileSync(notificationsPath, 'utf-8'))
        : [];
    const nonLues = notifications.filter(n => n.userId === user.id && !n.lu);
    res.status(200).json({ count: nonLues.length });
}
function compterMessagesNonLus(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    const messagesPath = path_1.default.join(__dirname, '..', 'data', 'messages.json');
    const messages = fs_1.default.existsSync(messagesPath)
        ? JSON.parse(fs_1.default.readFileSync(messagesPath, 'utf-8'))
        : [];
    // Filtrer les messages non lus reçus par l'utilisateur
    const messagesNonLus = messages.filter(m => parseInt(m.to) === user.id && !m.lu);
    res.status(200).json(messagesNonLus);
}
function formatDateFr(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function updateProfil(req, res) {
    const user = req.user;
    const { nom, email, date_naissance } = req.body;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    // Récupérer l'utilisateur complet depuis la base de données
    const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(user.email);
    if (!utilisateur) {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
        return;
    }
    // Mettre à jour les champs
    utilisateur.nom = nom || utilisateur.nom;
    utilisateur.email = email || utilisateur.email;
    utilisateur.dateNaissance = date_naissance || utilisateur.dateNaissance;
    // Sauvegarder les modifications
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    const index = utilisateurs.findIndex(u => u.id === utilisateur.id);
    if (index !== -1) {
        utilisateurs[index] = utilisateur;
        fs_1.default.writeFileSync(path_1.default.join(__dirname, '..', 'data', 'utilisateurs.json'), JSON.stringify(utilisateurs, null, 2));
    }
    res.status(200).json({
        message: 'Profil mis à jour avec succès',
        utilisateur: {
            id: utilisateur.id,
            nom: utilisateur.nom,
            email: utilisateur.email,
            role: utilisateur.role,
            date_naissance: utilisateur.dateNaissance
        }
    });
}
function verifyPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const { currentPassword } = req.body;
        if (!user) {
            res.status(401).json({ message: 'Non authentifié.' });
            return;
        }
        const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(user.email);
        if (!utilisateur) {
            res.status(404).json({ message: 'Utilisateur non trouvé.' });
            return;
        }
        const estValide = yield bcryptjs_1.default.compare(currentPassword, utilisateur.password);
        if (!estValide) {
            res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
            return;
        }
        res.status(200).json({ message: 'Mot de passe correct.' });
    });
}
function changePassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const { newPassword } = req.body;
        if (!user) {
            res.status(401).json({ message: 'Non authentifié.' });
            return;
        }
        // Validation du mot de passe
        const estLongAssez = newPassword.length >= 6;
        const contientLettre = /[a-zA-Z]/.test(newPassword);
        const contientChiffre = /\d/.test(newPassword);
        if (!estLongAssez || !contientLettre || !contientChiffre) {
            res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 6 caractères, avec au moins une lettre et un chiffre.'
            });
            return;
        }
        const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(user.email);
        if (!utilisateur) {
            res.status(404).json({ message: 'Utilisateur non trouvé.' });
            return;
        }
        // Hasher le nouveau mot de passe
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        // Mettre à jour le mot de passe
        utilisateur.password = hashedPassword;
        // Sauvegarder les modifications
        const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
        const index = utilisateurs.findIndex(u => u.id === utilisateur.id);
        if (index !== -1) {
            utilisateurs[index] = utilisateur;
            fs_1.default.writeFileSync(path_1.default.join(__dirname, '..', 'data', 'utilisateurs.json'), JSON.stringify(utilisateurs, null, 2));
        }
        res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
    });
}
