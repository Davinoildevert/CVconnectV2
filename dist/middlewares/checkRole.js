"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = checkRole;
function checkRole(roleAutorisé) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Utilisateur non authentifié.' });
            return;
        }
        if (req.user.role !== roleAutorisé) {
            res.status(403).json({ message: `Accès réservé aux ${roleAutorisé}s.` });
            return;
        }
        next();
    };
}
