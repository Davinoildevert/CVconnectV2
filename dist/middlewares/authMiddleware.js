"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../configs/jwt.config");
const utilisateurModel_1 = require("../models/utilisateurModel");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Token d\'authentification manquant.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.SECRET_KEY);
        // Vérifier si l'utilisateur existe et est actif
        const utilisateur = (0, utilisateurModel_1.findUtilisateurByEmail)(decoded.email);
        if (!utilisateur || !utilisateur.actif) {
            res.status(403).json({
                message: 'Votre compte a été désactivé par un administrateur. Veuillez contacter le support pour plus d\'informations.'
            });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
}
