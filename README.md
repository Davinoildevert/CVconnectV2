# CVConnect

CVConnect est une plateforme web réalisée en binôme dans le cadre d’un projet étudiant. Elle permet de gérer des profils candidats, des CV et des interactions avec des recruteurs à travers une API Node.js / Express écrite en TypeScript.

Le projet met surtout l’accent sur la **conception d’un backend REST, l’authentification, la gestion des rôles et la manipulation de données côté serveur**.

## Stack technique

- **TypeScript**
- **Node.js**
- **Express**
- **JWT** pour l’authentification
- **bcryptjs** pour le hachage des mots de passe
- **Puppeteer** pour la génération de PDF
- **JSON** pour le stockage des données dans cette version
- HTML / CSS / JavaScript pour les vues

> Cette version publique utilise des fichiers JSON comme stockage. Une migration vers une base de données comme MongoDB ou PostgreSQL fait partie des évolutions possibles du projet.

## Fonctionnalités implémentées

### Utilisateurs
- création de compte ;
- rôles candidat / recruteur ;
- authentification par JWT ;
- hachage des mots de passe ;
- consultation et modification du profil ;
- changement et réinitialisation du mot de passe ;
- activation/désactivation de comptes.

### CV
- création et consultation de CV ;
- modification et suppression ;
- filtrage par compétences ;
- génération d’un CV ;
- export PDF ;
- gestion de favoris côté recruteur.

### Interactions
- système de suggestions ;
- notifications ;
- messagerie interne ;
- contrôle d’accès selon le rôle.

## Architecture

```text
CVconnectV2/
├── src/
│   ├── controllers/       # logique des routes
│   ├── models/            # accès aux données
│   ├── routes/            # endpoints Express
│   ├── middlewares/       # authentification et rôles
│   ├── configs/           # configuration
│   ├── views/             # vues frontend
│   └── server.ts          # point d’entrée
├── data/                  # stockage JSON
├── public/
├── package.json
└── tsconfig.json
```

## API

Le serveur expose notamment des routes pour :

- `/utilisateurs` — comptes, profil, authentification ;
- `/cvs` — gestion des CV ;
- `/competences` — gestion des compétences ;
- `/admin` — actions d’administration ;
- `/suggestions` — suggestions utilisateurs.

Certaines routes sont protégées par un middleware JWT et par une vérification du rôle utilisateur.

## Installation

```bash
git clone https://github.com/Davinoildevert/CVconnectV2.git
cd CVconnectV2
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.

## Points techniques travaillés

- conception d’une API REST avec Express ;
- TypeScript côté serveur ;
- authentification JWT ;
- middleware d’autorisation ;
- hachage de mots de passe ;
- séparation routes / contrôleurs / modèles ;
- validation des données ;
- génération PDF avec Puppeteer ;
- gestion de plusieurs rôles applicatifs.

## Limites actuelles

- stockage JSON adapté au contexte pédagogique mais pas à une mise en production ;
- tests automatisés encore à renforcer ;
- certaines fonctionnalités mériteraient une couche de persistance dédiée ;
- le frontend reste secondaire par rapport au travail backend.

## Évolutions possibles

- migration vers MongoDB ou PostgreSQL ;
- ajout de tests unitaires et d’intégration ;
- documentation OpenAPI ;
- conteneurisation ;
- CI/CD ;
- amélioration du frontend.

## Auteurs

- **Davino Ildevert ANDRIANARIVONY**
- **OSSORIA KOUMAKPAYI Marc-David Koudirati**
