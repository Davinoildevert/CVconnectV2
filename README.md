# CVConnect - Plateforme de Gestion de CV

## 📝 Description
CVConnect est une plateforme web moderne qui permet aux utilisateurs de créer, gérer et partager leur CV de manière professionnelle. Développé dans le cadre d'un projet éducatif, CVConnect utilise TypeScript, Node.js et Express pour offrir une expérience utilisateur moderne et sécurisée.

## 🚀 Fonctionnalités

### Pour les Candidats
#### Gestion du Profil
- Création et gestion de compte avec informations personnelles
- Modification des informations de contact
- Changement de mot de passe sécurisé
- Gestion des préférences de confidentialité
- Visualisation de l'historique des connexions

#### Gestion des CV
- Création de plusieurs CV personnalisés
- Ajout et modification des sections :
  - Informations personnelles
  - Expériences professionnelles
  - Formations et diplômes
  - Compétences techniques et soft skills
  - Langues maîtrisées
  - Projets réalisés
  - Certifications
- Mise à jour en temps réel des modifications
- Prévisualisation du CV avant publication
- Gestion des versions de CV

#### Suivi des Consultations
- Tableau de bord des statistiques de visites
- Historique des entreprises consultantes
- Notifications des nouvelles consultations
- Statistiques de visibilité du profil
- Suivi de l'évolution de la popularité du CV

### Pour les Recruteurs
#### Recherche de Profils
- Recherche avancée par :
  - Compétences techniques
  - Niveau d'expérience
  - Localisation
  - Formation
  - Langues
  - Disponibilité
- Filtres multiples combinables
- Sauvegarde des recherches fréquentes
- Suggestions de profils pertinents

#### Gestion des Favoris
- Création de listes de favoris
- Organisation des profils par catégories
- Partage de listes avec l'équipe
- Export des listes de candidats
- Notes et commentaires sur les profils

#### Interface Recruteur
- Tableau de bord personnalisé
- Statistiques de recherche
- Historique des consultations
- Gestion des offres d'emploi
- Suivi des candidatures

### Pour les Administrateurs
#### Gestion des Utilisateurs
- Création et suppression de comptes
- Modification des rôles utilisateurs
- Désactivation/réactivation de comptes
- Gestion des permissions
- Suivi des activités utilisateurs
- Historique des actions administratives

#### Gestion des CV
- Validation des CV publiés
- Modération du contenu
- Gestion des signalements
- Statistiques de publication
- Suivi des modifications

#### Gestion des Compétences
- Ajout/modification/suppression de compétences
- Catégorisation des compétences
- Gestion des tags
- Statistiques d'utilisation
- Suggestions de compétences populaires

#### Tableau de Bord Administratif
- Statistiques globales :
  - Nombre d'utilisateurs actifs
  - Nombre de CV publiés
  - Taux de conversion
  - Activité des recruteurs
  - Popularité des compétences
- Graphiques et visualisations
- Rapports d'activité
- Alertes et notifications
- Export des données

## 🛠️ Technologies Utilisées

### Frontend
- HTML5/CSS3
- TypeScript
- JavaScript (ES6+)
- Chart.js pour les graphiques
- Font Awesome pour les icônes
- CSS Grid et Flexbox pour la mise en page
- Media Queries pour la responsivité
- LocalStorage pour le stockage local
- Fetch API pour les requêtes HTTP

### Backend
- Node.js
- Express.js
- TypeScript
- JWT pour l'authentification
- JSON pour le stockage des données
- Middleware de validation
- Gestion des erreurs
- Système de logs
- Compression des réponses

## 📋 Prérequis
- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- Git
- Navigateur web moderne
- Connexion Internet

## 🔧 Installation

1. Cloner le repository
```bash
git clone https://github.com/votre-username/CVConnect.git
cd CVConnect
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Modifier le fichier `.env` avec vos configurations :
- `PORT` : Port du serveur (par défaut 3000)
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `NODE_ENV` : Environnement (development/production)

4. Lancer l'application
```bash
npm run dev
```

## 📁 Structure du Projet
```
CVConnect/
├── src/
│   ├── controllers/    # Contrôleurs de l'application
│   │   ├── adminController.ts
│   │   ├── cvController.ts
│   │   ├── suggestionController.ts
│   │   └── utilisateurController.ts
│   ├── models/        # Modèles de données
│   │   ├── cvModel.ts
│   │   ├── suggestionModel.ts
│   │   └── utilisateurModel.ts
│   ├── routes/        # Routes de l'API
│   │   ├── adminRoutes.ts
│   │   ├── cvRoutes.ts
│   │   └── utilisateurRoutes.ts
│   ├── middlewares/   # Middlewares personnalisés
│   │   ├── authMiddleware.ts
│   │   └── validationMiddleware.ts
│   ├── configs/       # Fichiers de configuration
│   │   └── database.ts
│   └── Views/         # Vues et assets frontend
│       ├── css/
│       ├── js/
│       └── pages/
├── data/              # Fichiers JSON pour le stockage
│   ├── cvs.json
│   ├── suggestions.json
│   └── utilisateurs.json
└── public/            # Fichiers statiques
    ├── images/
    └── fonts/
```

## 🔐 Sécurité
- Authentification JWT avec expiration
- Protection des routes sensibles
- Validation des données côté serveur
- Gestion des rôles (candidat, recruteur, admin)
- Protection contre les injections
- Hachage des mots de passe
- Protection CSRF
- Rate limiting
- Sanitization des entrées
- Headers de sécurité

## 📊 API Endpoints

### Authentification
- `POST /utilisateurs/inscription` - Inscription
  - Body: { email, password, role, nom, prenom }
  - Response: { token, utilisateur }
- `POST /utilisateurs/login` - Connexion
  - Body: { email, password }
  - Response: { token, utilisateur }
- `POST /utilisateurs/logout` - Déconnexion
  - Headers: { Authorization: Bearer token }
  - Response: { message }

### CV
- `GET /cvs` - Liste des CV
  - Query: { page, limit, search, filters }
  - Response: { cvs, total, page }
- `POST /cvs` - Création d'un CV
  - Headers: { Authorization: Bearer token }
  - Body: { titre, contenu, competences }
  - Response: { cv }
- `PUT /cvs/:id` - Modification d'un CV
  - Headers: { Authorization: Bearer token }
  - Body: { titre, contenu, competences }
  - Response: { cv }
- `DELETE /cvs/:id` - Suppression d'un CV
  - Headers: { Authorization: Bearer token }
  - Response: { message }

### Utilisateurs
- `GET /utilisateurs/me` - Profil utilisateur
  - Headers: { Authorization: Bearer token }
  - Response: { utilisateur }
- `PUT /utilisateurs/me` - Modification du profil
  - Headers: { Authorization: Bearer token }
  - Body: { nom, prenom, email }
  - Response: { utilisateur }
- `PUT /utilisateurs/password` - Changement de mot de passe
  - Headers: { Authorization: Bearer token }
  - Body: { oldPassword, newPassword }
  - Response: { message }

### Admin
- `GET /admin/utilisateurs` - Liste des utilisateurs
  - Headers: { Authorization: Bearer token }
  - Query: { page, limit, role }
  - Response: { utilisateurs, total, page }
- `GET /admin/cvs` - Liste des CV
  - Headers: { Authorization: Bearer token }
  - Query: { page, limit, status }
  - Response: { cvs, total, page }
- `GET /admin/stats` - Statistiques
  - Headers: { Authorization: Bearer token }
  - Response: { stats }
- `PATCH /admin/utilisateurs/:id/status` - Changement de statut utilisateur
  - Headers: { Authorization: Bearer token }
  - Body: { actif }
  - Response: { message }

## 👥 Auteurs
- OSSORIA KOUMAKPAYI Marc-David Koudirati
- Davino Ildevert ANDRIANARIVONY

## 📝 Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔄 Améliorations Futures
- [ ] Implémentation d'une vraie base de données (MongoDB/PostgreSQL)
- [ ] Ajout de tests unitaires et d'intégration
- [ ] Système de messagerie entre candidats et recruteurs
- [ ] Système de notifications en temps réel
- [ ] Export de CV en PDF
- [ ] Intégration de l'authentification OAuth
- [ ] Système de recommandation de profils
- [ ] API de recherche avancée
- [ ] Système de notation des profils
- [ ] Intégration de LinkedIn
- [ ] Système de matching automatique
- [ ] Tableau de bord analytique avancé

## 🤝 Contribution
Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support
Pour toute question ou problème :
1. Consultez la documentation
2. Vérifiez les issues existantes
3. Ouvrez une nouvelle issue avec :
   - Description du problème
   - Étapes pour reproduire
   - Comportement attendu
   - Captures d'écran si pertinent
   - Environnement (OS, navigateur, etc.)

## Pages

- **Accueil** (`/index.html`) : Page d'accueil avec présentation rapide
- **À propos** (`/about.html`) : Page détaillant les fonctionnalités et avantages de CVConnect
- **Connexion** (`/login.html`) : Interface de connexion
- **Inscription** (`/register.html`) : Formulaire d'inscription
- **Dashboard** (`/dashboard.html`) : Interface utilisateur après connexion
- **Création de CV** (`/create-cv.html`) : Interface de création de CV
- **Profil** (`/profile.html`) : Gestion du profil utilisateur

