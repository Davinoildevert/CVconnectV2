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
exports.afficherCVs = afficherCVs;
exports.getCVByUtilisateurId = getCVByUtilisateurId;
exports.ajouterCV = ajouterCV;
exports.ajouterCVParCandidat = ajouterCVParCandidat;
exports.updateCVByUtilisateurId = updateCVByUtilisateurId;
exports.supprimerCVParUtilisateur = supprimerCVParUtilisateur;
exports.renderGenerateCV = renderGenerateCV;
exports.getCVById = getCVById;
exports.telechargerCVenPDF = telechargerCVenPDF;
exports.listerFavoris = listerFavoris;
exports.ajouterFavori = ajouterFavori;
exports.retirerFavori = retirerFavori;
exports.checkFavori = checkFavori;
exports.getNotifications = getNotifications;
exports.marquerNotificationCommeLue = marquerNotificationCommeLue;
exports.ajouterSuggestion = ajouterSuggestion;
exports.listerSuggestions = listerSuggestions;
const cvModel_1 = require("../models/cvModel");
const competenceModel_1 = require("../models/competenceModel");
const utilisateurModel_1 = require("../models/utilisateurModel");
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utilisateurController_1 = require("./utilisateurController");
function parseList(input) {
    if (Array.isArray(input))
        return input;
    if (typeof input === 'string')
        return input.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}
// Fonction utilitaire pour gérer le fichier favoris.json
function getFavorisFile() {
    const favorisPath = path_1.default.join(__dirname, '..', 'data', 'favoris.json');
    const dataDir = path_1.default.join(__dirname, '..', 'data');
    // Créer le dossier data s'il n'existe pas
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    // Créer le fichier favoris.json s'il n'existe pas
    if (!fs_1.default.existsSync(favorisPath)) {
        fs_1.default.writeFileSync(favorisPath, '[]', 'utf-8');
        return [];
    }
    try {
        const content = fs_1.default.readFileSync(favorisPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (err) {
        console.error('Erreur lecture favoris.json:', err);
        fs_1.default.writeFileSync(favorisPath, '[]', 'utf-8');
        return [];
    }
}
// GET /cvs
function afficherCVs(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    const cvs = user.role === 'candidat'
        ? (0, cvModel_1.getCVsByUtilisateurId)(user.id)
        : (0, cvModel_1.getAllCVs)();
    const competences = (0, competenceModel_1.getAllCompetences)();
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    const mapCompetences = new Map();
    competences.forEach(comp => mapCompetences.set(comp.id, comp.nom));
    const mapUtilisateurs = new Map();
    utilisateurs.forEach(user => {
        mapUtilisateurs.set(user.id, {
            id: user.id,
            nom: user.nom,
            email: user.email,
            role: user.role,
            dateNaissance: user.dateNaissance
        });
    });
    const cvsAvecDetails = cvs.map(cv => ({
        id: cv.id,
        titre: cv.titre,
        utilisateur: mapUtilisateurs.get(cv.utilisateurId) || { id: cv.utilisateurId, nom: 'Inconnu', email: '', role: '' },
        competences: cv.competences.map(id => {
            const numId = typeof id === 'string' ? parseInt(id) : id;
            return mapCompetences.get(numId) || 'Inconnue';
        }),
        formations: cv.formations || '',
        experiences: cv.experiences || '',
        softskills: cv.softskills || '',
        langues: cv.langues || '',
        photo: cv.photo || '',
        description: cv.description || '',
        telephone: cv.telephone || '',
        adresse: cv.adresse || '',
        style: cv.style || 'classique'
    }));
    // 🔍 Filtrage par compétence (si query param présent)
    const { competence } = req.query;
    let cvsFiltres = cvsAvecDetails;
    if (competence && typeof competence === "string") {
        const recherche = competence.toLowerCase();
        cvsFiltres = cvsAvecDetails.filter(cv => cv.competences.some(c => c.toLowerCase().includes(recherche)));
    }
    res.json(cvsFiltres);
}
// GET /utilisateurs/:id/cv
function getCVByUtilisateurId(req, res) {
    const utilisateurIdParam = parseInt(req.params.id);
    if (isNaN(utilisateurIdParam)) {
        res.status(400).json({ message: 'ID utilisateur invalide.' });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (user.role === 'candidat' && user.id !== utilisateurIdParam) {
        res.status(403).json({ message: 'Accès interdit à ce CV.' });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    const competences = (0, competenceModel_1.getAllCompetences)();
    const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
    const cv = cvs.find(c => c.utilisateurId === utilisateurIdParam);
    if (!cv) {
        res.status(404).json({ message: 'Aucun CV trouvé pour cet utilisateur.' });
        return;
    }
    const utilisateur = utilisateurs.find(u => u.id === utilisateurIdParam);
    if (!utilisateur) {
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return;
    }
    const mapCompetences = new Map();
    competences.forEach(c => mapCompetences.set(c.id, c.nom));
    const cvAvecInfos = {
        id: cv.id,
        titre: cv.titre,
        utilisateur: {
            id: utilisateur.id,
            nom: utilisateur.nom,
            email: utilisateur.email,
            role: utilisateur.role
        },
        competences: cv.competences.map(id => mapCompetences.get(id) || 'Inconnue'),
        formations: cv.formations || '',
        experiences: cv.experiences || '',
        softskills: cv.softskills || '',
        langues: cv.langues || '',
        photo: cv.photo || '',
        description: cv.description || '',
        telephone: cv.telephone || '',
        adresse: cv.adresse || '',
        style: cv.style || 'classique'
    };
    res.json(cvAvecInfos);
}
// POST /cvs (admin ou générique)
function ajouterCV(req, res) {
    const { utilisateurId, titre, competences, formations, experiences, softskills, langues, photo, description, telephone, adresse // ✅
     } = req.body;
    if (!utilisateurId || !titre || !Array.isArray(competences)) {
        res.status(400).json({ message: 'Champs requis manquants ou invalides.' });
        return;
    }
    if (telephone && !/^\+\d{6,15}$/.test(telephone)) {
        res.status(400).json({ message: 'Format du numéro de téléphone invalide (ex: +33612345678).' });
        return;
    }
    const nouveauCV = {
        id: 0,
        utilisateurId,
        titre,
        competences,
        formations: parseList(formations),
        experiences: parseList(experiences),
        softskills: parseList(softskills),
        langues: parseList(langues),
        photo,
        description,
        telephone,
        adresse, //
        style: req.body.style || 'classique'
    };
    (0, cvModel_1.addCV)(nouveauCV);
    res.status(201).json({ message: 'CV ajouté avec succès.' });
}
// POST /cvs/create (par un candidat connecté)
function ajouterCVParCandidat(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (user.role !== 'candidat') {
        res.status(403).json({ message: 'Seuls les candidats peuvent créer un CV.' });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    const dejaUnCV = cvs.some(cv => cv.utilisateurId === user.id);
    if (dejaUnCV) {
        res.status(409).json({ message: 'Vous avez déjà un CV.' });
        return;
    }
    const { titre, competences, formations, experiences, softskills, langues, photo, description, telephone, adresse // ✅
     } = req.body;
    if (adresse && adresse.length < 5) {
        res.status(400).json({ message: "Adresse trop courte." });
        return;
    }
    if (!titre || !Array.isArray(competences)) {
        res.status(400).json({ message: 'Titre et compétences requis.' });
        return;
    }
    if (telephone && !/^\+\d{6,15}$/.test(telephone)) {
        res.status(400).json({ message: 'Format du numéro de téléphone invalide (ex: +33612345678).' });
        return;
    }
    const nouveauCV = {
        id: 0,
        utilisateurId: user.id,
        titre,
        competences,
        formations: parseList(formations),
        experiences: parseList(experiences),
        softskills: parseList(softskills),
        langues: parseList(langues),
        photo,
        description,
        telephone,
        adresse, //
        style: req.body.style || 'classique'
    };
    (0, cvModel_1.addCV)(nouveauCV);
    res.status(201).json({ message: 'CV créé avec succès.' });
}
// PUT /utilisateurs/:id/cv
function updateCVByUtilisateurId(req, res) {
    const utilisateurId = parseInt(req.params.id);
    const { titre, competences, formations, experiences, softskills, langues, photo, description, telephone, adresse // ✅ 
     } = req.body;
    if (isNaN(utilisateurId)) {
        res.status(400).json({ message: 'ID utilisateur invalide.' });
        return;
    }
    if (!titre || !Array.isArray(competences)) {
        res.status(400).json({ message: 'Champs "titre" et "competences" requis.' });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    const index = cvs.findIndex(cv => cv.utilisateurId === utilisateurId);
    if (index === -1) {
        res.status(404).json({ message: 'Aucun CV trouvé pour cet utilisateur.' });
        return;
    }
    cvs[index] = Object.assign(Object.assign({}, cvs[index]), { titre,
        competences, formations: parseList(formations), experiences: parseList(experiences), softskills: parseList(softskills), langues: parseList(langues), photo,
        description,
        telephone,
        adresse, style: req.body.style || 'classique' });
    (0, cvModel_1.saveCVs)(cvs);
    res.status(200).json({ message: 'CV mis à jour avec succès.', cv: cvs[index] });
}
// DELETE /utilisateurs/:id/cv
function supprimerCVParUtilisateur(req, res) {
    const utilisateurId = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (user.role !== 'admin' && user.id !== utilisateurId) {
        res.status(403).json({ message: 'Accès interdit.' });
        return;
    }
    (0, cvModel_1.deleteCVsByUtilisateurId)(utilisateurId);
    res.status(200).json({ message: 'CV supprimé avec succès.' });
}
function renderGenerateCV(req, res) {
    const style = req.query.style || 'classique-1';
    const user = req.user;
    if (!user) {
        res.status(401).send('Non authentifié.');
        return;
    }
    const cvs = (0, cvModel_1.getCVsByUtilisateurId)(user.id);
    if (cvs.length === 0) {
        res.status(404).send('Aucun CV trouvé.');
        return;
    }
    const utilisateur = (0, utilisateurModel_1.getAllUtilisateurs)().find(u => u.id === user.id);
    if (!utilisateur) {
        res.status(404).send('Utilisateur introuvable.');
        return;
    }
    const cv = cvs[0]; // Premier CV trouvé
    const competences = (0, competenceModel_1.getAllCompetences)().map(c => c.nom); // à adapter si nécessaire
    let age = '';
    if (utilisateur.dateNaissance) {
        const birth = new Date(utilisateur.dateNaissance);
        const now = new Date();
        let calculatedAge = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            calculatedAge--;
        }
        age = calculatedAge.toString();
    }
    res.render('generate-cv', { style, cv, utilisateur, age });
}
// GET /cvs/:id → accessible par recruteur
function getCVById(req, res) {
    const cvId = parseInt(req.params.id);
    if (isNaN(cvId)) {
        res.status(400).json({ message: "ID de CV invalide." });
        return;
    }
    const cvs = (0, cvModel_1.getAllCVs)();
    const cv = cvs.find(c => c.id === cvId);
    if (!cv) {
        res.status(404).json({ message: "CV introuvable." });
        return;
    }
    const utilisateur = (0, utilisateurModel_1.getAllUtilisateurs)().find(u => u.id === cv.utilisateurId);
    const competences = (0, competenceModel_1.getAllCompetences)();
    const mapCompetences = new Map();
    competences.forEach(c => mapCompetences.set(c.id, c.nom));
    res.json({
        id: cv.id,
        titre: cv.titre,
        utilisateur: {
            id: (utilisateur === null || utilisateur === void 0 ? void 0 : utilisateur.id) || 0,
            nom: (utilisateur === null || utilisateur === void 0 ? void 0 : utilisateur.nom) || "Inconnu",
            email: (utilisateur === null || utilisateur === void 0 ? void 0 : utilisateur.email) || "",
            role: (utilisateur === null || utilisateur === void 0 ? void 0 : utilisateur.role) || ""
        },
        competences: cv.competences.map(id => mapCompetences.get(id) || "Inconnue"),
        formations: cv.formations || [],
        experiences: cv.experiences || [],
        softskills: cv.softskills || [],
        langues: cv.langues || [],
        photo: cv.photo || '',
        description: cv.description || '',
        telephone: cv.telephone || '',
        adresse: cv.adresse || '',
        style: cv.style || 'classique'
    });
}
function telechargerCVenPDF(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cvId = parseInt(req.params.id);
            if (isNaN(cvId)) {
                res.status(400).json({ message: 'ID de CV invalide.' });
                return;
            }
            // Récupération des données de base
            const cv = (0, cvModel_1.getAllCVs)().find(c => c.id === cvId);
            const utilisateur = (0, utilisateurModel_1.getAllUtilisateurs)().find(u => u.id === (cv === null || cv === void 0 ? void 0 : cv.utilisateurId));
            if (!cv || !utilisateur) {
                res.status(404).json({ message: 'CV ou utilisateur non trouvé.' });
                return;
            }
            // HTML basique pour le test
            const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>CV Test</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .section { margin-bottom: 20px; }
            h1 { color: #2563eb; }
          </style>
        </head>
        <body>
          <h1>${cv.titre || 'Mon CV'}</h1>
          
          <div class="section">
            <h2>Informations Personnelles</h2>
            <p>Nom: ${utilisateur.nom}</p>
            <p>Email: ${utilisateur.email}</p>
            <p>Téléphone: ${cv.telephone || 'Non renseigné'}</p>
          </div>

          <div class="section">
            <h2>Description</h2>
            <p>${cv.description || 'Aucune description'}</p>
          </div>

          <div class="section">
            <h2>Compétences</h2>
            <ul>
              ${cv.competences.map(comp => `<li>${comp}</li>`).join('')}
            </ul>
          </div>
        </body>
      </html>
    `;
            // Configuration minimale de Puppeteer
            const browser = yield puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox']
            });
            const page = yield browser.newPage();
            yield page.setContent(htmlContent);
            // Génération PDF simple
            const pdf = yield page.pdf({
                format: 'A4',
                margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }
            });
            yield browser.close();
            // Envoi du PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=cv-test.pdf');
            res.send(pdf);
        }
        catch (error) {
            console.error('Erreur PDF:', error);
            res.status(500).json({
                message: 'Erreur lors de la génération du PDF',
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            });
        }
    });
}
function listerFavoris(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    console.log('User role:', user.role);
    console.log('User id:', user.id);
    if (user.role !== 'recruteur') {
        console.log('Accès refusé - rôle incorrect:', user.role);
        res.status(403).json({ message: 'Accès réservé aux recruteurs.' });
        return;
    }
    try {
        console.log('Lecture des favoris pour utilisateur:', user.id);
        const favoris = getFavorisFile();
        console.log('Favoris bruts:', JSON.stringify(favoris, null, 2));
        const mesFavoris = favoris.filter(f => f.recruteurId === user.id);
        console.log('Favoris filtrés pour utilisateur:', JSON.stringify(mesFavoris, null, 2));
        const cvs = (0, cvModel_1.getAllCVs)();
        console.log('Nombre total de CVs:', cvs.length);
        const utilisateurs = (0, utilisateurModel_1.getAllUtilisateurs)();
        console.log('Nombre total d\'utilisateurs:', utilisateurs.length);
        const resultats = mesFavoris.map(f => {
            console.log('Traitement du favori:', JSON.stringify(f, null, 2));
            const cv = cvs.find(c => c.id === f.cvId);
            if (!cv) {
                console.log('CV non trouvé pour id:', f.cvId);
                return null;
            }
            console.log('CV trouvé:', JSON.stringify(cv, null, 2));
            // Conversion des IDs de compétences en nombres
            const competencesNumeriques = cv.competences.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
            cv.competences = competencesNumeriques;
            const utilisateur = utilisateurs.find(u => u.id === cv.utilisateurId);
            if (!utilisateur) {
                console.log('Utilisateur non trouvé pour cv:', cv.id);
                return null;
            }
            console.log('Utilisateur trouvé:', JSON.stringify(utilisateur, null, 2));
            return {
                date: f.date,
                cvId: f.cvId,
                titre: cv.titre || 'CV sans titre',
                utilisateur: {
                    nom: utilisateur.nom,
                    email: utilisateur.email
                }
            };
        }).filter(f => f !== null);
        console.log('Résultats finaux:', JSON.stringify(resultats, null, 2));
        res.status(200).json(resultats);
    }
    catch (err) {
        console.error('Erreur listerFavoris:', err);
        res.status(500).json({ message: 'Erreur lors du chargement des favoris' });
    }
}
function ajouterFavori(req, res) {
    const user = req.user;
    const { cvId } = req.body;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (user.role !== 'recruteur') {
        res.status(403).json({ message: 'Seuls les recruteurs peuvent ajouter des favoris.' });
        return;
    }
    if (!cvId || typeof cvId !== 'number') {
        res.status(400).json({ message: 'ID du CV manquant ou invalide.' });
        return;
    }
    try {
        const favoris = getFavorisFile();
        const existe = favoris.some(f => f.recruteurId === user.id && f.cvId === cvId);
        if (existe) {
            res.status(409).json({ message: 'Ce CV est déjà dans vos favoris.' });
            return;
        }
        const cv = (0, cvModel_1.getAllCVs)().find(c => c.id === cvId);
        if (!cv) {
            res.status(404).json({ message: 'CV introuvable.' });
            return;
        }
        // Ajouter aux favoris
        favoris.push({
            recruteurId: user.id,
            cvId,
            date: new Date().toISOString()
        });
        const favorisPath = path_1.default.join(__dirname, '..', 'data', 'favoris.json');
        fs_1.default.writeFileSync(favorisPath, JSON.stringify(favoris, null, 2), 'utf-8');
        // Créer la notification
        const notificationsPath = path_1.default.join(__dirname, '..', 'data', 'notifications.json');
        const notifications = fs_1.default.existsSync(notificationsPath)
            ? JSON.parse(fs_1.default.readFileSync(notificationsPath, 'utf-8'))
            : [];
        notifications.push({
            id: notifications.length > 0 ? notifications[notifications.length - 1].id + 1 : 1,
            userId: cv.utilisateurId,
            message: `${user.nom} a ajouté votre CV en favori.`,
            lu: false,
            date: new Date().toISOString()
        });
        fs_1.default.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2), 'utf-8');
        res.status(201).json({ message: 'CV ajouté aux favoris.' });
    }
    catch (err) {
        console.error('Erreur ajouterFavori:', err);
        res.status(500).json({ message: 'Erreur lors de l\'ajout aux favoris' });
    }
}
function retirerFavori(req, res) {
    const user = req.user;
    const cvId = parseInt(req.params.cvId);
    if (!user || user.role !== 'recruteur') {
        res.status(403).json({ message: 'Seuls les recruteurs peuvent retirer des favoris.' });
        return;
    }
    try {
        const favoris = getFavorisFile();
        const avant = favoris.length;
        const nouveauxFavoris = favoris.filter(f => !(f.recruteurId === user.id && f.cvId === cvId));
        if (nouveauxFavoris.length === avant) {
            res.status(404).json({ message: 'Ce CV n\'est pas dans vos favoris.' });
            return;
        }
        const favorisPath = path_1.default.join(__dirname, '..', 'data', 'favoris.json');
        fs_1.default.writeFileSync(favorisPath, JSON.stringify(nouveauxFavoris, null, 2), 'utf-8');
        res.status(200).json({ message: 'CV retiré des favoris.' });
    }
    catch (err) {
        console.error('Erreur retirerFavori:', err);
        res.status(500).json({ message: 'Erreur lors du retrait des favoris' });
    }
}
function checkFavori(req, res) {
    const user = req.user;
    const cvId = parseInt(req.params.cvId);
    if (!user || user.role !== 'recruteur') {
        res.status(403).json({ message: 'Accès réservé aux recruteurs.' });
        return;
    }
    try {
        const favoris = getFavorisFile();
        const isFavori = favoris.some(f => f.recruteurId === user.id && f.cvId === cvId);
        res.status(200).json({ isFavori });
    }
    catch (err) {
        console.error('Erreur checkFavori:', err);
        res.status(500).json({ message: 'Erreur lors de la vérification des favoris' });
    }
}
function getNotifications(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    const notificationsPath = path_1.default.join(__dirname, '..', 'data', 'notifications.json');
    const notifications = fs_1.default.existsSync(notificationsPath)
        ? JSON.parse(fs_1.default.readFileSync(notificationsPath, 'utf-8'))
        : [];
    const userNotifications = notifications.filter(n => n.userId === user.id);
    const formatées = userNotifications.map(n => (Object.assign(Object.assign({}, n), { dateLisible: (0, utilisateurController_1.formatDateFr)(n.date) })));
    res.status(200).json(formatées);
}
function marquerNotificationCommeLue(req, res) {
    const user = req.user;
    const notificationId = parseInt(req.params.id);
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    const notificationsPath = path_1.default.join(__dirname, '..', 'data', 'notifications.json');
    const notifications = fs_1.default.existsSync(notificationsPath)
        ? JSON.parse(fs_1.default.readFileSync(notificationsPath, 'utf-8'))
        : [];
    const index = notifications.findIndex(n => n.id === notificationId && n.userId === user.id);
    if (index === -1) {
        res.status(404).json({ message: 'Notification non trouvée.' });
        return;
    }
    notifications[index].lu = true;
    fs_1.default.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2), 'utf-8');
    res.status(200).json({ message: 'Notification marquée comme lue.' });
}
function ajouterSuggestion(req, res) {
    const user = req.user;
    const { contenu, type } = req.body;
    if (!user) {
        res.status(401).json({ message: 'Non authentifié.' });
        return;
    }
    if (!contenu || !type) {
        res.status(400).json({ message: 'Contenu et type requis (ex : competence, idée, autre).' });
        return;
    }
    const suggestionsPath = path_1.default.join(__dirname, '..', 'data', 'suggestions.json');
    const suggestions = fs_1.default.existsSync(suggestionsPath)
        ? JSON.parse(fs_1.default.readFileSync(suggestionsPath, 'utf-8'))
        : [];
    const nouvelleSuggestion = {
        id: suggestions.length > 0 ? suggestions[suggestions.length - 1].id + 1 : 1,
        fromUserId: user.id,
        contenu,
        type,
        date: new Date().toISOString()
    };
    suggestions.push(nouvelleSuggestion);
    fs_1.default.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2), 'utf-8');
    res.status(201).json({ message: 'Suggestion enregistrée.' });
}
function listerSuggestions(req, res) {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        res.status(403).json({ message: 'Accès réservé à l\'administrateur.' });
        return;
    }
    const suggestionsPath = path_1.default.join(__dirname, '..', 'data', 'suggestions.json');
    const suggestions = fs_1.default.existsSync(suggestionsPath)
        ? JSON.parse(fs_1.default.readFileSync(suggestionsPath, 'utf-8'))
        : [];
    res.status(200).json(suggestions);
}
