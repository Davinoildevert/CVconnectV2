
/// <reference path="./types/express/index.d.ts" />
import express, { Request, Response } from 'express';

import utilisateurRoutes from './routes/utilisateurRoutes';

import competenceRoutes from './routes/competenceRoutes';
import cvRoutes from './routes/cvRoutes';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
// 3. Définition du port d'écoute
const PORT = 3000;

// 4. Middleware pour lire les requêtes JSON
app.use(express.json());
app.use('/utilisateurs', utilisateurRoutes);
app.use('/competences', competenceRoutes);


app.use('/cvs', cvRoutes);

// 5. Route de test
app.get('/', (req: Request, res: Response) => {
  res.send(' Bienvenue sur l’API CVConnect (Back-end)');
});

// 6. Démarrage du serveur
app.listen(PORT, () => {
  console.log(` Serveur en ligne sur http://localhost:${PORT}`);
});
