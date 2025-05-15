"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cvController_1 = require("../controllers/cvController");
const utilisateurController_1 = require("../controllers/utilisateurController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const utilisateurController_2 = require("../controllers/utilisateurController");
const utilisateurController_3 = require("../controllers/utilisateurController");
const utilisateurController_4 = require("../controllers/utilisateurController");
const router = express_1.default.Router();
router.get('/:id/cv', authMiddleware_1.authMiddleware, cvController_1.getCVByUtilisateurId);
router.get('/', utilisateurController_1.afficherUtilisateurs);
router.post('/', utilisateurController_1.ajouterUtilisateur);
router.delete('/:id', authMiddleware_1.authMiddleware, utilisateurController_1.supprimerUtilisateur);
router.post('/login', utilisateurController_1.loginUtilisateur); //  Login ici
router.get('/test-protected', authMiddleware_1.authMiddleware, (req, res) => {
    var _a;
    res.json({ message: `Bienvenue ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.nom}`, user: req.user });
});
router.get('/me', authMiddleware_1.authMiddleware, utilisateurController_1.getProfilConnecte);
router.put('/me', authMiddleware_1.authMiddleware, utilisateurController_1.updateProfil);
// Demande de réinitialisation (génère un token)
router.post('/reset-password-request', utilisateurController_2.demanderResetPassword);
// Réinitialisation avec le token reçu
router.post('/reset-password/:token', utilisateurController_2.reinitialiserPassword);
// ✉️ Messagerie interne
router.post('/messages', authMiddleware_1.authMiddleware, utilisateurController_3.envoyerMessage);
router.get('/messages/conversation/:userId', authMiddleware_1.authMiddleware, utilisateurController_3.lireMessages);
router.get('/messages', authMiddleware_1.authMiddleware, utilisateurController_3.lireTousMessages);
router.get('/messages/non-lus', authMiddleware_1.authMiddleware, utilisateurController_3.compterMessagesNonLus);
router.get('/notifications/unread-count', authMiddleware_1.authMiddleware, utilisateurController_4.compterNotificationsNonLues);
// Routes pour le changement de mot de passe
router.post('/verify-password', authMiddleware_1.authMiddleware, utilisateurController_1.verifyPassword);
router.put('/change-password', authMiddleware_1.authMiddleware, utilisateurController_1.changePassword);
exports.default = router;
