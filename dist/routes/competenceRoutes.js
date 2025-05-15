"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const competenceController_1 = require("../controllers/competenceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const checkRole_1 = require("../middlewares/checkRole");
const router = express_1.default.Router();
// Routes publiques
router.get('/', competenceController_1.getAllCompetences);
// Routes protégées (admin)
router.post('/', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('admin'), competenceController_1.addCompetence);
router.delete('/:id', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('admin'), competenceController_1.deleteCompetence);
exports.default = router;
