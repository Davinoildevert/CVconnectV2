"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cvController_1 = require("../controllers/cvController");
const cvController_2 = require("../controllers/cvController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const checkRole_1 = require("../middlewares/checkRole");
const cvController_3 = require("../controllers/cvController");
const cvController_4 = require("../controllers/cvController");
const cvController_5 = require("../controllers/cvController");
const cvController_6 = require("../controllers/cvController");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authMiddleware, cvController_1.afficherCVs);
router.get('/utilisateurs/:id/cv', cvController_1.getCVByUtilisateurId);
router.put('/utilisateurs/:id/cv', cvController_1.updateCVByUtilisateurId);
router.post('/create', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('candidat'), cvController_2.ajouterCVParCandidat);
router.delete('/utilisateurs/:id/cv', authMiddleware_1.authMiddleware, cvController_1.supprimerCVParUtilisateur);
router.get('/generate-cv', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('candidat'), cvController_2.renderGenerateCV);
// ⭐ Gérer les favoris (recruteurs uniquement)
router.post('/favoris', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('recruteur'), cvController_4.ajouterFavori);
router.delete('/favoris/:cvId', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('recruteur'), cvController_4.retirerFavori);
router.get('/favoris', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('recruteur'), cvController_4.listerFavoris);
router.get('/favoris/check/:cvId', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('recruteur'), cvController_4.checkFavori);
// 🔔 Notifications pour l'utilisateur connecté
router.get('/notifications', authMiddleware_1.authMiddleware, cvController_5.getNotifications);
router.patch('/notifications/:id', authMiddleware_1.authMiddleware, cvController_5.marquerNotificationCommeLue);
// 💬 Suggestions (candidat ou recruteur)
router.post('/suggestions', authMiddleware_1.authMiddleware, cvController_6.ajouterSuggestion);
// 🔐 Voir toutes les suggestions (admin uniquement)
router.get('/suggestions', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('admin'), cvController_6.listerSuggestions);
// Route publique pour recruteur
router.get('/:id', cvController_3.getCVById); // GET /cvs/3
router.get('/:id/pdf', authMiddleware_1.authMiddleware, cvController_3.telechargerCVenPDF);
exports.default = router;
