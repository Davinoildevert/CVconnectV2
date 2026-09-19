# CVConnect

Plateforme web réalisée en binôme pour gérer des **profils candidats, des CV et des interactions recruteur/candidat** à travers un backend REST Node.js / Express écrit en TypeScript.

## Ma contribution

J’ai réalisé **l’intégralité du backend** du projet.

- **Conçu et développé** le backend TypeScript / Node.js / Express en structurant l’application en routes, contrôleurs, modèles et middlewares.
- **Implémenté** l’authentification JWT et le hachage des mots de passe avec bcrypt.
- **Mis en place** la gestion des rôles et les contrôles d’accès côté serveur.
- **Développé** les fonctionnalités de création, consultation, modification, suppression et export PDF des CV.
- **Intégré** les favoris, notifications, suggestions et la messagerie interne.
- **Géré** la persistance JSON de cette version et la validation des échanges côté serveur.

## Stack technique

- **TypeScript**
- **Node.js**
- **Express**
- **JWT**
- **bcryptjs**
- **Puppeteer**
- **JSON** pour la persistance de cette version
- HTML / CSS / JavaScript

> La version publique utilise actuellement des fichiers JSON. MongoDB ou PostgreSQL constituent des pistes d’évolution, et ne sont pas présentés comme déjà intégrés.

## Fonctionnalités

### Utilisateurs
- création de compte ;
- rôles candidat / recruteur ;
- authentification JWT ;
- hachage des mots de passe ;
- profil utilisateur ;
- changement / réinitialisation de mot de passe ;
- activation / désactivation de comptes.

### CV
- création ;
- consultation ;
- modification ;
- suppression ;
- filtrage par compétences ;
- génération et export PDF ;
- favoris recruteur.

### Interactions
- suggestions ;
- notifications ;
- messagerie interne ;
- contrôle d’accès selon le rôle.

## Architecture

```text
CVconnectV2/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── configs/
│   ├── views/
│   └── server.ts
├── data/
├── public/
├── package.json
└── tsconfig.json
```

## API

Principaux groupes de routes :

- `/utilisateurs`
- `/cvs`
- `/competences`
- `/admin`
- `/suggestions`

Les routes sensibles utilisent l’authentification JWT et des vérifications de rôle.

## Installation

```bash
git clone https://github.com/Davinoildevert/CVconnectV2.git
cd CVconnectV2
npm install
npm run dev
```

Serveur : `http://localhost:3000`

## Compétences démontrées

**TypeScript • Node.js • Express • API REST • JWT • autorisation par rôles • validation de données • génération PDF • architecture backend**

## Limites & améliorations

- stockage JSON adapté au contexte pédagogique ;
- tests automatisés à renforcer ;
- migration future vers MongoDB ou PostgreSQL ;
- documentation OpenAPI ;
- CI/CD et conteneurisation.

## Auteurs

- **Davino Ildevert ANDRIANARIVONY**
- **OSSORIA KOUMAKPAYI Marc-David Koudirati**
