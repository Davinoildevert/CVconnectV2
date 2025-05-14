import { Request, Response } from 'express';
import {
  getAllCVs,
  saveCVs,
  addCV,
  CV,
  getCVsByUtilisateurId,
  deleteCVsByUtilisateurId
} from '../models/cvModel';
import { getAllCompetences } from '../models/competenceModel';
import { getAllUtilisateurs } from '../models/utilisateurModel';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import {formatDateFr} from './utilisateurController'

function parseList(input: any): string[] {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

// Fonction utilitaire pour gérer le fichier favoris.json
function getFavorisFile(): any[] {
  const favorisPath = path.join(__dirname, '..', 'data', 'favoris.json');
  const dataDir = path.join(__dirname, '..', 'data');
  
  // Créer le dossier data s'il n'existe pas
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Créer le fichier favoris.json s'il n'existe pas
  if (!fs.existsSync(favorisPath)) {
    fs.writeFileSync(favorisPath, '[]', 'utf-8');
    return [];
  }
  
  try {
    const content = fs.readFileSync(favorisPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Erreur lecture favoris.json:', err);
    fs.writeFileSync(favorisPath, '[]', 'utf-8');
    return [];
  }
}

// GET /cvs
export function afficherCVs(req: Request, res: Response): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  const cvs = user.role === 'candidat'
    ? getCVsByUtilisateurId(user.id)
    : getAllCVs();

  const competences = getAllCompetences();
  const utilisateurs = getAllUtilisateurs();

  const mapCompetences = new Map<number, string>();
  competences.forEach(comp => mapCompetences.set(comp.id, comp.nom));

  const mapUtilisateurs = new Map<number, { id: number; nom: string; email: string; role: string; dateNaissance?: string  }>();
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
    cvsFiltres = cvsAvecDetails.filter(cv =>
      cv.competences.some(c => c.toLowerCase().includes(recherche))
    );
  }

  res.json(cvsFiltres);
}

// GET /utilisateurs/:id/cv
export function getCVByUtilisateurId(req: Request, res: Response): void {
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

  const cvs = getAllCVs();
  const competences = getAllCompetences();
  const utilisateurs = getAllUtilisateurs();

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

  const mapCompetences = new Map<number, string>();
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
export function ajouterCV(req: Request, res: Response): void {
  const {
    utilisateurId,
    titre,
    competences,
    formations,
    experiences,
    softskills,
    langues,
    photo,
    description,
    telephone,
    adresse // ✅
  } = req.body;

  if (!utilisateurId || !titre || !Array.isArray(competences)) {
    res.status(400).json({ message: 'Champs requis manquants ou invalides.' });
    return;
  }
  if (telephone && !/^\+\d{6,15}$/.test(telephone)) {
    res.status(400).json({ message: 'Format du numéro de téléphone invalide (ex: +33612345678).' });
    return;
  }

  const nouveauCV: CV = {
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

  addCV(nouveauCV);
  res.status(201).json({ message: 'CV ajouté avec succès.' });
}

// POST /cvs/create (par un candidat connecté)
export function ajouterCVParCandidat(req: Request, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  if (user.role !== 'candidat') {
    res.status(403).json({ message: 'Seuls les candidats peuvent créer un CV.' });
    return;
  }

  const cvs = getAllCVs();
  const dejaUnCV = cvs.some(cv => cv.utilisateurId === user.id);
  if (dejaUnCV) {
    res.status(409).json({ message: 'Vous avez déjà un CV.' });
    return;
  }

  const {
    titre,
    competences,
    formations,
    experiences,
    softskills,
    langues,
    photo, 
    description,
    telephone,
    adresse // ✅
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
    return ;
  }

  const nouveauCV: CV = {
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

  addCV(nouveauCV);
  res.status(201).json({ message: 'CV créé avec succès.' });
}

// PUT /utilisateurs/:id/cv
export function updateCVByUtilisateurId(req: Request, res: Response): void {
  const utilisateurId = parseInt(req.params.id);
  const {
    titre,
    competences,
    formations,
    experiences,
    softskills,
    langues,
    photo, 
    description,
    telephone,
    adresse // ✅ 
  } = req.body;

  if (isNaN(utilisateurId)) {
    res.status(400).json({ message: 'ID utilisateur invalide.' });
    return;
  }

  if (!titre || !Array.isArray(competences)) {
    res.status(400).json({ message: 'Champs "titre" et "competences" requis.' });
    return;
  }

  const cvs = getAllCVs();
  const index = cvs.findIndex(cv => cv.utilisateurId === utilisateurId);

  if (index === -1) {
    res.status(404).json({ message: 'Aucun CV trouvé pour cet utilisateur.' });
    return;
  }

  cvs[index] = {
    ...cvs[index],
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

  saveCVs(cvs);
  res.status(200).json({ message: 'CV mis à jour avec succès.', cv: cvs[index] });
}

// DELETE /utilisateurs/:id/cv
export function supprimerCVParUtilisateur(req: Request, res: Response): void {
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

  deleteCVsByUtilisateurId(utilisateurId);
  res.status(200).json({ message: 'CV supprimé avec succès.' });
}

export function renderGenerateCV(req: Request, res: Response): void {
  const style = req.query.style as string || 'classique-1';
  const user = req.user;

  if (!user) {
    res.status(401).send('Non authentifié.');
    return;
  }

  const cvs = getCVsByUtilisateurId(user.id);
  if (cvs.length === 0) {
    res.status(404).send('Aucun CV trouvé.');
    return;
  }

  const utilisateur = getAllUtilisateurs().find(u => u.id === user.id);
  if (!utilisateur) {
    res.status(404).send('Utilisateur introuvable.');
    return;
  }

  const cv = cvs[0]; // Premier CV trouvé
  const competences = getAllCompetences().map(c => c.nom); // à adapter si nécessaire
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
export function getCVById(req: Request, res: Response): void {
  const cvId = parseInt(req.params.id);
  if (isNaN(cvId)) {
    res.status(400).json({ message: "ID de CV invalide." });
    return;
  }

  const cvs = getAllCVs();
  const cv = cvs.find(c => c.id === cvId);
  if (!cv) {
    res.status(404).json({ message: "CV introuvable." });
    return;
  }

  const utilisateur = getAllUtilisateurs().find(u => u.id === cv.utilisateurId);
  const competences = getAllCompetences();

  const mapCompetences = new Map<number, string>();
  competences.forEach(c => mapCompetences.set(c.id, c.nom));

  res.json({
    id: cv.id,
    titre: cv.titre,
    utilisateur: {
      id: utilisateur?.id || 0,
      nom: utilisateur?.nom || "Inconnu",
      email: utilisateur?.email || "",
      role: utilisateur?.role || ""
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

export async function telechargerCVenPDF(req: Request, res: Response): Promise<void> {
  try {
    const cvId = parseInt(req.params.id);
    if (isNaN(cvId)) {
      res.status(400).json({ message: 'ID de CV invalide.' });
      return;
    }

    // Récupération des données de base
    const cv = getAllCVs().find(c => c.id === cvId);
    const utilisateur = getAllUtilisateurs().find(u => u.id === cv?.utilisateurId);
    
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
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent);

    // Génération PDF simple
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }
    });

    await browser.close();

    // Envoi du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cv-test.pdf');
    res.send(pdf);

  } catch (error) {
    console.error('Erreur PDF:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération du PDF',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

export function listerFavoris(req: Request, res: Response): void {
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
    
    const cvs = getAllCVs();
    console.log('Nombre total de CVs:', cvs.length);
    
    const utilisateurs = getAllUtilisateurs();
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
      const competencesNumeriques = cv.competences.map(id => 
        typeof id === 'string' ? parseInt(id, 10) : id
      );
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
  } catch (err) {
    console.error('Erreur listerFavoris:', err);
    res.status(500).json({ message: 'Erreur lors du chargement des favoris' });
  }
}

export function ajouterFavori(req: Request, res: Response): void {
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

    const cv = getAllCVs().find(c => c.id === cvId);
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

    const favorisPath = path.join(__dirname, '..', 'data', 'favoris.json');
    fs.writeFileSync(favorisPath, JSON.stringify(favoris, null, 2), 'utf-8');

    // Créer la notification
    const notificationsPath = path.join(__dirname, '..', 'data', 'notifications.json');
    const notifications: any[] = fs.existsSync(notificationsPath)
      ? JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'))
      : [];

    notifications.push({
      id: notifications.length > 0 ? notifications[notifications.length - 1].id + 1 : 1,
      userId: cv.utilisateurId,
      message: `${user.nom} a ajouté votre CV en favori.`,
      lu: false,
      date: new Date().toISOString()
    });

    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2), 'utf-8');

    res.status(201).json({ message: 'CV ajouté aux favoris.' });
  } catch (err) {
    console.error('Erreur ajouterFavori:', err);
    res.status(500).json({ message: 'Erreur lors de l\'ajout aux favoris' });
  }
}

export function retirerFavori(req: Request, res: Response): void {
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

    const favorisPath = path.join(__dirname, '..', 'data', 'favoris.json');
    fs.writeFileSync(favorisPath, JSON.stringify(nouveauxFavoris, null, 2), 'utf-8');
    
    res.status(200).json({ message: 'CV retiré des favoris.' });
  } catch (err) {
    console.error('Erreur retirerFavori:', err);
    res.status(500).json({ message: 'Erreur lors du retrait des favoris' });
  }
}

export function checkFavori(req: Request, res: Response): void {
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
  } catch (err) {
    console.error('Erreur checkFavori:', err);
    res.status(500).json({ message: 'Erreur lors de la vérification des favoris' });
  }
}

export function getNotifications(req: Request, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  const notificationsPath = path.join(__dirname, '..', 'data', 'notifications.json');
  const notifications: any[] = fs.existsSync(notificationsPath)
    ? JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'))
    : [];

  const userNotifications = notifications.filter(n => n.userId === user.id);
  const formatées = userNotifications.map(n => ({
    ...n,
    dateLisible: formatDateFr(n.date)
  }));
  res.status(200).json(formatées);
}

export function marquerNotificationCommeLue(req: Request, res: Response): void {
  const user = req.user;
  const notificationId = parseInt(req.params.id);

  if (!user) {
    res.status(401).json({ message: 'Non authentifié.' });
    return;
  }

  const notificationsPath = path.join(__dirname, '..', 'data', 'notifications.json');
  const notifications: any[] = fs.existsSync(notificationsPath)
    ? JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'))
    : [];

  const index = notifications.findIndex(n => n.id === notificationId && n.userId === user.id);
  if (index === -1) {
    res.status(404).json({ message: 'Notification non trouvée.' });
    return;
  }

  notifications[index].lu = true;
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2), 'utf-8');

  res.status(200).json({ message: 'Notification marquée comme lue.' });
}

export function ajouterSuggestion(req: Request, res: Response): void {
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

  const suggestionsPath = path.join(__dirname, '..', 'data', 'suggestions.json');
  const suggestions: any[] = fs.existsSync(suggestionsPath)
    ? JSON.parse(fs.readFileSync(suggestionsPath, 'utf-8'))
    : [];

  const nouvelleSuggestion = {
    id: suggestions.length > 0 ? suggestions[suggestions.length - 1].id + 1 : 1,
    fromUserId: user.id,
    contenu,
    type,
    date: new Date().toISOString()
  };

  suggestions.push(nouvelleSuggestion);
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2), 'utf-8');

  res.status(201).json({ message: 'Suggestion enregistrée.' });
}

export function listerSuggestions(req: Request, res: Response): void {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Accès réservé à l\'administrateur.' });
    return;
  }

  const suggestionsPath = path.join(__dirname, '..', 'data', 'suggestions.json');
  const suggestions: any[] = fs.existsSync(suggestionsPath)
    ? JSON.parse(fs.readFileSync(suggestionsPath, 'utf-8'))
    : [];

  res.status(200).json(suggestions);
}
