import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../configs/jwt.config';
import { findUtilisateurByEmail } from '../models/utilisateurModel';

interface JwtPayload {
  id: number;
  nom: string;
  email: string;
  role: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token d\'authentification manquant.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    
    // Vérifier si l'utilisateur existe et est actif
    const utilisateur = findUtilisateurByEmail(decoded.email);
    if (!utilisateur || !utilisateur.actif) {
      res.status(403).json({ 
        message: 'Votre compte a été désactivé par un administrateur. Veuillez contacter le support pour plus d\'informations.' 
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}
