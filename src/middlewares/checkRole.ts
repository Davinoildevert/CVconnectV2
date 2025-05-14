import { Request, Response, NextFunction } from 'express';

export function checkRole(roleAutorisé: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Utilisateur non authentifié.' });
      return;
    }

    if (req.user.role !== roleAutorisé) {
      res.status(403).json({ message: `Accès réservé aux ${roleAutorisé}s.` });
      return;
    }

    next();
  };
}
