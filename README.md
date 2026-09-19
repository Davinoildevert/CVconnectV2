# CVConnect

Plateforme web réalisée en binôme pour gérer des **profils candidats, des CV et des interactions recruteur/candidat** à travers un backend REST Node.js / Express écrit en TypeScript.

## En bref — contribution & valeur

- **Co-développé** un backend TypeScript structuré en routes, contrôleurs, modèles et middlewares.
- **Implémenté** l’authentification JWT et le hachage des mots de passe avec bcrypt.
- **Géré** plusieurs rôles applicatifs avec contrôle d’accès côté serveur.
- **Ajouté** la création, modification, consultation et export PDF des CV.
- **Intégré** favoris, notifications, suggestions et messagerie interne pour couvrir plusieurs parcours utilisateurs.

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
