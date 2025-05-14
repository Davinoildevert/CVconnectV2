/// <reference path="./types/express/index.d.ts" />
import express, { Request, Response } from 'express';
import path from 'path';

import utilisateurRoutes from './routes/utilisateurRoutes';
import adminRoutes from './routes/adminRoutes';
import competenceRoutes from './routes/competenceRoutes';
import cvRoutes from './routes/cvRoutes';
import dotenv from 'dotenv';
import suggestionRoutes from './routes/suggestionRoutes';
dotenv.config();

const app = express();
const PORT = 3000;

// Lire les requêtes JSON
app.use(express.json());

// ✅ Servir le dossier "views" statiquement
app.use(express.static(path.join(__dirname, 'views')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/utilisateurs', utilisateurRoutes);
app.use('/competences', competenceRoutes);
app.use('/cvs', cvRoutes);
app.use('/admin', adminRoutes);

// Route de test
app.get('/', (req: Request, res: Response) => {
  res.send('Bienvenue sur l’API CVConnect (Back-end)');
});

app.use('/suggestions', suggestionRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
