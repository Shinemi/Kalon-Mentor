# Tests

Depuis `back/` : `npm test` (Jest).
Depuis `front/` : `npm test` (Vitest) ou `npm run test:watch`.
Installer les dépendances dans chaque dossier avec `npm ci`.

Les tests de routes backend remplacent les modèles et services externes par des mocks. La suite `database.test.js` utilise un véritable moteur PostgreSQL WASM (PGlite) en mémoire avec le schéma versionné : aucune connexion à la base de production, à Brevo, à Blob ou à Gemini n’est effectuée. Jest utilise les modules VM pour charger ce moteur.

PGlite utilise une seule connexion. Le pool de test sérialise les transactions : il valide les contraintes, requêtes, périodes Europe/Paris, plafonds et réservations persistantes. Une recette supplémentaire avec plusieurs connexions et instances Node reste nécessaire pour mesurer la contention réelle en production.

Les scénarios backend couvrent notamment :

- Les accès JWT, les sessions révoquées ou expirées, la modification du mot de passe et la suppression du compte avec nettoyage des images.
- Les six opérations d’administration : refus sans session ou sans rôle admin, listes, statistiques d’analyses, quota IA indisponible et création de cours avec validation et conflit d’ordre.
- L’analyse d’une image avec conversion WebP réelle en mémoire, les erreurs IA, le refus des uploads trop volumineux, les recommandations et la limite de galerie.
- La lecture des images privées et la cohérence des sauvegardes/suppressions lors d’un échec SQL ou Blob.
- Le service Gemini avec `fetch` simulé : requête, clé manquante, indisponibilité, erreurs HTTP/réseau, réponses vides et JSON invalide.
- Swagger : correspondance avec les routes, références de schémas, déclaration des accès et chargement des assets avec la politique CSP.

Les tests frontend utilisent jsdom et React Testing Library : authentification, sessions, formulaires de connexion/inscription, récupération du mot de passe et consentement analytics. Aucun script Google ni appel API réel n’est exécuté.

Ces tests ne remplacent pas une validation d’intégration avec les services externes réels ou un parcours complet dans un navigateur. Le catalogue réel de 48 cours et ses consignes pédagogiques ne sont pas chargés dans la base de test.

Autres vérifications frontend : `npm run build` et `npm run lint`.
