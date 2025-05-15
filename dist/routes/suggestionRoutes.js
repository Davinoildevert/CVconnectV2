"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const checkRole_1 = require("../middlewares/checkRole");
const suggestionController_1 = require("../controllers/suggestionController");
const router = express_1.default.Router();
// Route publique pour ajouter une suggestion
router.post('/', authMiddleware_1.authMiddleware, suggestionController_1.createSuggestion);
// Routes admin pour gérer les suggestions
router.get('/', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('admin'), suggestionController_1.getSuggestions);
router.patch('/:id/status', authMiddleware_1.authMiddleware, (0, checkRole_1.checkRole)('admin'), suggestionController_1.updateStatus);
exports.default = router;
