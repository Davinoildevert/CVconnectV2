export interface Suggestion {
  id: number;
  fromUserId: number;
  contenu: string;
  type: 'competence' | 'fonctionnalite' | 'autre';
  date: string;
}
