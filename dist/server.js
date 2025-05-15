"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./types/express/index.d.ts" />
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const utilisateurRoutes_1 = __importDefault(require("./routes/utilisateurRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const competenceRoutes_1 = __importDefault(require("./routes/competenceRoutes"));
const cvRoutes_1 = __importDefault(require("./routes/cvRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
const suggestionRoutes_1 = __importDefault(require("./routes/suggestionRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 3000;
// Lire les requêtes JSON
app.use(express_1.default.json());
// ✅ Servir le dossier "views" statiquement
app.use(express_1.default.static(path_1.default.join(__dirname, 'views')));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
// Routes API
app.use('/utilisateurs', utilisateurRoutes_1.default);
app.use('/competences', competenceRoutes_1.default);
app.use('/cvs', cvRoutes_1.default);
app.use('/admin', adminRoutes_1.default);
// Route de test
app.get('/', (req, res) => {
    res.send('Bienvenue sur l’API CVConnect (Back-end)');
});
app.use('/suggestions', suggestionRoutes_1.default);
// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
