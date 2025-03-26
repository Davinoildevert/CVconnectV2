// 1. Importation des modules
import express, { Request, Response } from 'express';

// 2. Création de l'application Express
const app = express();

// 3. Définition du port d'écoute
const PORT = 3000;

// 4. Middleware pour lire les requêtes JSON
app.use(express.json());

// 5. Route de test
app.get('/', (req: Request, res: Response) => {
  res.send(' Bienvenue sur l’API CVConnect (Back-end)');
});

// 6. Démarrage du serveur
app.listen(PORT, () => {
  console.log(` Serveur en ligne sur http://localhost:${PORT}`);
});
