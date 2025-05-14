import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Type de suggestion
interface Suggestion {
  id: number;
  fromUserId: number;
  contenu: string;
  type: 'competence' | 'fonctionnalite' | 'autre';
  date: string;
}

const filePath = path.join(__dirname, '..', 'data', 'suggestions.json');

// 🔄 Fonction pour lire les suggestions
function getAllSuggestions(): Suggestion[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// ✅ POST /suggestions
export function ajouterSuggestion(req: Request, res: Response): void {
  const user = req.user;
  const { contenu, type } = req.body;

  if (!user) {
    res.status(401).json({ message: "Non authentifié." });
    return;
  }

  if (!contenu || !type) {
    res.status(400).json({ message: "Contenu et type requis." });
    return;
  }

  const suggestions = getAllSuggestions();
  const nouvelleSuggestion: Suggestion = {
    id: suggestions.length > 0 ? suggestions[suggestions.length - 1].id + 1 : 1,
    fromUserId: user.id,
    contenu,
    type,
    date: new Date().toISOString()
  };

  suggestions.push(nouvelleSuggestion);
  fs.writeFileSync(filePath, JSON.stringify(suggestions, null, 2), 'utf-8');

  res.status(201).json({ message: "Suggestion envoyée avec succès." });
}

// ✅ GET /suggestions (admin uniquement)
export function getSuggestions(req: Request, res: Response): void {
  const suggestions = getAllSuggestions();
  res.status(200).json(suggestions);
}
