"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUtilisateurs = getAllUtilisateurs;
exports.addUtilisateur = addUtilisateur;
exports.deleteUtilisateur = deleteUtilisateur;
exports.findUtilisateurByEmail = findUtilisateurByEmail;
exports.toggleStatutUtilisateur = toggleStatutUtilisateur;
exports.setResetToken = setResetToken;
exports.resetPasswordByToken = resetPasswordByToken;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 2. Chemin vers le fichier JSON
const filePath = path_1.default.join(__dirname, '..', 'data', 'utilisateurs.json');
// 3. Fonction pour lire tous les utilisateurs
function getAllUtilisateurs() {
    try {
        const rawData = fs_1.default.readFileSync(filePath, 'utf8');
        let utilisateurs = JSON.parse(rawData);
        const now = new Date();
        // Nettoyer les tokens expirés
        let modifié = false;
        utilisateurs = utilisateurs.map(u => {
            if (u.resetToken && u.resetTokenExpiration && new Date(u.resetTokenExpiration) < now) {
                modifié = true;
                return Object.assign(Object.assign({}, u), { resetToken: undefined, resetTokenExpiration: undefined });
            }
            return u;
        });
        if (modifié) {
            fs_1.default.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf-8');
        }
        return utilisateurs;
    }
    catch (error) {
        console.error('Erreur lecture fichier utilisateurs:', error);
        return [];
    }
}
// Ajouter un utilisateur
function addUtilisateur(newUtilisateur) {
    const utilisateurs = getAllUtilisateurs();
    const newId = utilisateurs.length > 0 ? utilisateurs[utilisateurs.length - 1].id + 1 : 1;
    newUtilisateur.id = newId;
    utilisateurs.push(newUtilisateur);
    fs_1.default.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
    return newUtilisateur;
}
// Supprimer un utilisateur
function deleteUtilisateur(id) {
    const utilisateurs = getAllUtilisateurs();
    const updated = utilisateurs.filter(u => u.id !== id);
    fs_1.default.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
}
// Trouver par email
function findUtilisateurByEmail(email) {
    const utilisateurs = getAllUtilisateurs();
    return utilisateurs.find(u => u.email === email);
}
// Activer/désactiver un utilisateur
function toggleStatutUtilisateur(id, actif) {
    const utilisateurs = getAllUtilisateurs();
    const index = utilisateurs.findIndex(u => u.id === id);
    if (index === -1)
        return false;
    utilisateurs[index].actif = actif;
    fs_1.default.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
    return true;
}
// Définir un token de réinitialisation
function setResetToken(email, token, expiration) {
    const utilisateurs = getAllUtilisateurs();
    const index = utilisateurs.findIndex(u => u.email === email);
    if (index === -1)
        return false;
    utilisateurs[index].resetToken = token;
    utilisateurs[index].resetTokenExpiration = expiration;
    fs_1.default.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
    return true;
}
// Réinitialiser un mot de passe par token
function resetPasswordByToken(token, hashedPassword) {
    const utilisateurs = getAllUtilisateurs();
    const now = new Date();
    const index = utilisateurs.findIndex(u => u.resetToken === token &&
        u.resetTokenExpiration &&
        new Date(u.resetTokenExpiration) > now);
    if (index === -1)
        return false;
    utilisateurs[index].password = hashedPassword;
    utilisateurs[index].resetToken = undefined;
    utilisateurs[index].resetTokenExpiration = undefined;
    fs_1.default.writeFileSync(filePath, JSON.stringify(utilisateurs, null, 2), 'utf8');
    return true;
}
