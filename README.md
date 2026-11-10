# Kalon Mentor

<img src="front/public/Logo%20Kalon%20Mentor%20au%20trait%20noir.webp" alt="Logo Kalon Mentor" width="120">

**Un atelier de dessin accompagné par un mentor IA.**

Kalon Mentor permet de soumettre un dessin, de recevoir un retour pédagogique et de retrouver des cours adaptés aux points à travailler. L’utilisateur peut sauvegarder les analyses qu’il souhaite conserver dans son historique personnel.

Projet étudiant personnel réalisé dans le cadre de la formation Développeur Web et Web Mobile. Le MVP est proposé gratuitement, sans abonnement ni paiement.

[Découvrir l’application](https://kalon-mentor.vercel.app/) · [Informations légales](https://kalon-mentor.vercel.app/legal) · [Documentation des tests](TESTING.md)

## Fonctionnalités

### Parcours utilisateur

- Inscription avec acceptation des CGU et déclaration de majorité.
- Connexion, déconnexion, modification du profil et suppression de son compte.
- Réinitialisation du mot de passe par e-mail avec Brevo.
- Import d’un dessin depuis l’accueil ou la page de mentorat : JPG, PNG ou WebP, jusqu’à 10 Mo.
- Analyse par Gemini : résumé, points forts, pistes de progression et recommandations de cours.
- Lecture des cours par catégorie, avec objectifs, leçon, exercice et erreurs fréquentes.
- Accès direct aux cours recommandés grâce aux ancres.
- Sauvegarde volontaire des analyses, consultation de l’historique et suppression d’une sauvegarde.
- Gestion du consentement à la mesure d’audience Google Analytics.

### Administration

- Contrôle du rôle administrateur côté serveur.
- Consultation des utilisateurs et des nombres et dates de leurs réussites enregistrées.
- Consultation du catalogue et création de cours.
- Onglet de supervision IA préparé pour les quotas Gemini : il affiche actuellement « Information indisponible ».

Le journal des réussites est distinct de la galerie : une analyse réussie peut être comptabilisée sans être sauvegardée. Les analyses antérieures à la mise en place de ce journal ne sont pas reconstituées.

## Technologies

| Partie | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, SCSS, Lucide |
| API | Node.js, Express 5 |
| Base de données | PostgreSQL hébergé sur Supabase, accès avec `pg` |
| Authentification et validation | JWT, bcryptjs, Zod |
| Traitement des images | Multer, Sharp, conversion WebP |
| Analyse des dessins | API Gemini |
| Stockage des dessins sauvegardés | Vercel Blob privé |
| E-mails transactionnels | Brevo |
| Tests | Jest, Supertest, Vitest, React Testing Library, jsdom |
| Hébergement | Vercel pour le frontend, Render pour l’API |

Le navigateur appelle l’API Express. L’API communique avec PostgreSQL, Gemini, Vercel Blob et Brevo. Les clés de ces services restent côté backend.

## Organisation du dépôt

| Dossier ou fichier | Rôle |
| --- | --- |
| [`front/src/pages`](front/src/pages) | Pages et parcours de l’application |
| [`front/src/components`](front/src/components) | Composants d’interface, formulaires et affichage des analyses |
| [`front/src/services`](front/src/services) | Appels HTTP vers l’API |
| [`front/src/styles`](front/src/styles) | Variables et feuilles SCSS |
| [`front/src/utils/analytics.ts`](front/src/utils/analytics.ts) | Consentement et mesure d’audience |
| [`back/routes`](back/routes) | Routes et enchaînement des middlewares |
| [`back/controllers`](back/controllers) | Traitement des requêtes |
| [`back/models`](back/models) | Requêtes PostgreSQL paramétrées |
| [`back/schemas`](back/schemas) | Validation des données avec Zod |
| [`back/services`](back/services) | Intégrations Gemini, Blob et Brevo |
| [`back/tests`](back/tests) et [`front/tests`](front/tests) | Tests automatisés |
| [`TESTING.md`](TESTING.md) | Périmètre et commandes des tests |

## Installation locale

### Prérequis

- Node.js 24 et npm.
- Git.
- Une base PostgreSQL compatible avec les modèles du projet.
- Une clé Gemini pour l’analyse, un stockage Vercel Blob privé pour les sauvegardes et une configuration Brevo pour les e-mails de réinitialisation.

Les comptes, clés et données des services externes ne sont pas fournis avec le dépôt.

### 1. Récupérer le projet

```bash
git clone https://github.com/Shinemi/Kalon-Mentor.git
cd Kalon-Mentor
```

### 2. Configurer les variables d’environnement

Créer `back/.env` et `front/.env` avec les valeurs décrites dans la section [Configuration](#configuration).

Les fichiers `.env.exemple` du dépôt sont actuellement partiels : compléter la configuration avec les variables ci-dessous.

### 3. Préparer la base de données

Le dépôt ne contient pas encore de script SQL d’initialisation ni de jeu de données de cours. Il faut disposer d’une base préparée, compatible avec les tables et contraintes décrites dans la section [Base de données](#base-de-données).

Installer les dépendances ne crée pas les tables et ne peuple pas le catalogue.

### 4. Démarrer le backend

Depuis la racine du dépôt, dans un premier terminal :

```bash
cd back
npm ci
npm run dev
```

L’API utilise par défaut `http://localhost:3000`, avec les routes applicatives sous `/api/v1`.

### 5. Démarrer le frontend

Depuis la racine du dépôt, dans un second terminal :

```bash
cd front
npm ci
npm run dev
```

Vite utilise par défaut `http://localhost:5173`. Les origines autorisées par le backend doivent correspondre à l’adresse utilisée pour ouvrir le frontend.

## Configuration

### Backend — `back/.env`

```dotenv
PORT=3000
DATABASE_URI=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=REMPLACER_PAR_UN_SECRET_LONG_ET_ALEATOIRE
FRONTEND_URL=http://localhost:5173

GEMINI_API_KEY=VOTRE_CLE_GEMINI
BLOB_READ_WRITE_TOKEN=VOTRE_JETON_BLOB

BREVO_API_KEY=VOTRE_CLE_BREVO
BREVO_SENDER_EMAIL=expediteur@example.com
BREVO_SENDER_NAME="Kalon Mentor"
```

| Variable | Utilisation |
| --- | --- |
| `PORT` | Port HTTP de l’API ; `3000` par défaut |
| `DATABASE_URI` | Chaîne de connexion PostgreSQL de votre environnement |
| `JWT_SECRET` | Secret utilisé pour signer et vérifier les JWT |
| `FRONTEND_URL` | Origine autorisée par CORS et origine des liens de réinitialisation |
| `GEMINI_API_KEY` | Authentification auprès de Gemini |
| `BLOB_READ_WRITE_TOKEN` | Lecture, écriture et suppression dans le stockage Blob privé |
| `BREVO_API_KEY` | Envoi des e-mails transactionnels |
| `BREVO_SENDER_EMAIL` | Adresse d’expédition configurée dans Brevo |
| `BREVO_SENDER_NAME` | Nom d’expédition ; `Kalon Mentor` par défaut |

`FRONTEND_URL` doit contenir une origine, sans chemin ni slash final, par exemple `http://localhost:5173`.

Le modèle Gemini utilisé est défini dans [`back/services/aiService.js`](back/services/aiService.js). La clé configurée doit permettre son utilisation.

Sur Render, l’application utilise `trust proxy: 1` lorsque la variable `RENDER` vaut `true`.

### Frontend — `front/.env`

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
VITE_GA_MEASUREMENT_ID=
```

- `VITE_API_URL` inclut le préfixe `/api/v1`.
- `VITE_GA_MEASUREMENT_ID` est facultatif. La mesure d’audience est chargée uniquement après acceptation des cookies et avec un identifiant valide.
- Les variables `VITE_` sont exposées au navigateur. Les secrets PostgreSQL, JWT, Gemini, Blob et Brevo restent dans la configuration backend.
- Une modification des variables `VITE_` nécessite de redémarrer Vite en développement ou de reconstruire le frontend en production.

Les fichiers `.env` contenant les valeurs réelles doivent rester hors du dépôt.

## Base de données

Le code s’appuie sur les tables suivantes :

| Table | Données principales |
| --- | --- |
| `users` | Identité, mot de passe haché, rôle, preuves d’acceptation des CGU et de majorité, récupération du mot de passe et version des tokens |
| `resources` | Catalogue pédagogique, catégorie, type, ordre, auteur et contenu JSONB |
| `corrections` | Analyses sauvegardées par leur propriétaire et référence du dessin Blob |
| `corrections_resources` | Associations entre une analyse sauvegardée et les ressources recommandées |
| `analysis_events` | Identifiant d’une réussite, compte concerné et date |

Points nécessaires à la compatibilité du schéma :

- Les identifiants sont des UUID. `resources.id` est généré par défaut ; `analysis_events.id` est fourni par le serveur.
- `users.role` utilise les valeurs `member` et `admin`, avec `member` par défaut.
- L’inscription écrit `terms_accepted_at`, `terms_version` et `adult_declared_at`.
- La récupération utilise `password_reset_token_hash`, `password_reset_expires_at` et `token_version`.
- `resources.category` utilise les valeurs `proportions`, `anatomie`, `perspective`, `composition`, `couleurs` et `lumiere`.
- `resources.type` utilise les valeurs `course` et `video`.
- La combinaison `(category, order_index)` est unique ; le contrôleur de création reconnaît la contrainte `resources_category_order_unique`.
- `resources.is_active` est un booléen obligatoire, à `true` par défaut.
- Les relations entre comptes, corrections, ressources et événements doivent être présentes ; la suppression d’un compte doit notamment supprimer ses événements en cascade.

Le contenu pédagogique d’un cours est conservé dans `resources.content` : `level`, `lesson`, `exercise`, `objectives` et `commonMistakes`.

La table `analysis_locks` est prévue dans le schéma de conception, mais n’est pas utilisée par le code actuel.

### Compte administrateur

Créer d’abord un compte par l’inscription, puis attribuer manuellement la valeur `admin` à sa colonne `users.role` depuis l’outil d’administration de la base.

L’interface d’administration est accessible directement sous `/klmt/users`, `/klmt/ai` et `/klmt/courses`, sans lien dans le header public. Le rôle est vérifié côté serveur à chaque requête admin ; connaître l’adresse ne donne pas les droits.

## Fonctionnement de l’analyse

1. Le membre choisit un dessin, depuis l’accueil ou le mentorat.
2. L’image est envoyée en `multipart/form-data`, dans le champ `image`.
3. Sharp produit un WebP de 1 200 × 1 200 pixels maximum, envoyé à Gemini avec les métadonnées des ressources.
4. Le serveur valide le feedback avec Zod, prépare un aperçu de 800 × 800 pixels maximum et enregistre un événement de réussite.
5. Le frontend affiche le retour et les liens vers les cours recommandés.
6. L’utilisateur peut choisir de sauvegarder l’analyse : le dessin est alors stocké dans Blob privé et les références sont enregistrées en base.

Le jeton Blob est utilisé uniquement par le backend. La galerie récupère ses images privées par l’API. La sauvegarde est distincte du lancement de l’analyse.

## API

Préfixe local : `http://localhost:3000/api/v1`.

Pour les routes authentifiées, envoyer le header :

```http
Authorization: Bearer VOTRE_JWT
```

| Méthode | Route après `/api/v1` | Accès | Fonction |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Inscription |
| POST | `/auth/login` | Public | Connexion |
| GET | `/auth/profile` | Membre | Profil courant |
| PUT | `/auth/profileUpdate` | Membre | Modification du profil ou du mot de passe |
| DELETE | `/auth/profile` | Membre | Suppression de son propre compte |
| POST | `/auth/forgotPassword` | Public | Demande d’un e-mail de réinitialisation |
| POST | `/auth/resetPassword` | Public | Définition du nouveau mot de passe |
| GET | `/resources/courses` | Public | Catalogue, avec filtre facultatif `category` |
| GET | `/resources/courses/:id` | Public | Détail d’un cours |
| POST | `/mentor/correction` | Membre | Analyse d’un dessin |
| POST | `/mentor/correctionSave` | Membre | Sauvegarde volontaire d’une analyse |
| GET | `/mentor/correctionGallery` | Membre | Historique personnel |
| DELETE | `/mentor/correctionDelete/:id` | Propriétaire | Suppression d’une sauvegarde |
| GET | `/admin/access` | Admin | Vérification d’accès |
| GET | `/admin/users` | Admin | Liste des utilisateurs |
| GET | `/admin/users/:id/analyses` | Admin | Nombre et dates des réussites enregistrées |
| GET | `/admin/ai/status` | Admin | Disponibilité des informations de quota Gemini |
| GET | `/admin/courses` | Admin | Liste des cours |
| POST | `/admin/courses` | Admin | Création d’un cours |

Les schémas et règles d’entrée sont définis dans [`back/schemas`](back/schemas). L’inscription exige notamment l’acceptation des CGU, la déclaration de majorité et la version courante des conditions.

La création d’un cours renvoie `201`. Un ordre déjà utilisé dans la catégorie produit une réponse `409`. Les données refusées par Zod produisent une réponse `422`.

Les erreurs utilisent les propriétés `title`, `statut` et `invalidParams`. Les demandes de réinitialisation renvoient un message générique, que l’adresse corresponde ou non à un compte. Le lien de réinitialisation est valable 30 minutes et utilisable une seule fois.

## Tests et vérifications

### Backend

Depuis `back/` :

```bash
npm test
npm run test:watch
npm run test:coverage
```

La couverture est affichée dans le terminal. Les rapports HTML et LCOV sont enregistrés dans `back/coverage/`.

### Frontend

Depuis `front/` :

```bash
npm test
npm run test:watch
npm run lint
npm run build
```

Les tests existants remplacent les dépendances externes par des simulations. Ils ne valident pas la configuration réelle de PostgreSQL, Gemini, Blob ou Brevo, ni l’ensemble des parcours dans un navigateur.

Voir [`TESTING.md`](TESTING.md) pour le périmètre détaillé.

## Mise en production

| Composant | Hébergement |
| --- | --- |
| Frontend | Vercel |
| API Express | Render |
| PostgreSQL | Supabase |
| Dessins sauvegardés | Vercel Blob privé |

Le frontend se construit avec `npm run build` depuis `front/`, avec une sortie dans `front/dist/`. Le backend démarre avec `npm start` depuis `back/`.

Pour les adresses actuelles du projet :

- Backend : `FRONTEND_URL=https://kalon-mentor.vercel.app`.
- Frontend : `VITE_API_URL=https://kalon-mentor.onrender.com/api/v1`.

Le routage des pages React lors d’un accès direct ou d’un rafraîchissement est configuré dans [`front/vercel.json`](front/vercel.json). Le sitemap et `robots.txt` sont dans [`front/public`](front/public). L’accueil, les cours et les informations légales sont configurés comme indexables ; les espaces de compte, de mentorat et d’administration sont configurés en `noindex`.

## Limites actuelles et prochaines évolutions

- Le schéma SQL initial et les données de cours ne sont pas encore fournis sous forme de scripts versionnés.
- Les quotas métier d’analyses par jour et par mois et la réservation d’une analyse par compte ne sont pas encore implémentés. Les limitations HTTP par IP sont déjà présentes.
- La galerie prévoit un maximum de dix sauvegardes par compte. Son contrôle doit encore être renforcé pour les sauvegardes concurrentes.
- Une analyse non sauvegardée est perdue au rafraîchissement de la page.
- L’onglet IA renvoie actuellement une information de quota indisponible ; il n’est pas encore relié à une source de quotas Gemini.
- La modification et le retrait des cours, ainsi que la suppression d’un utilisateur depuis l’administration, restent à développer.

## Auteur

Lucas Simon — projet personnel de formation DWWM.

[GitHub](https://github.com/Shinemi) · [Contact](mailto:kalon-mentor@gmail.com)
