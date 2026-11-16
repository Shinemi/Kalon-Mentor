# Tests

Depuis `back/` : `npm test` (Jest).
Depuis `front/` : `npm test` (Vitest) ou `npm run test:watch`.
Installer les dépendances dans chaque dossier avec `npm ci`.

Les tests backend utilisent les routes Express et remplacent les modèles ainsi que les services externes par des mocks. Ils ne contactent ni PostgreSQL, ni Brevo, ni le stockage Blob, ni le service IA, et ne créent pas de fichiers d’upload. Les tests du modèle de récupération vérifient ses requêtes avec une connexion simulée.

Les scénarios backend couvrent notamment :

- Les accès JWT, les sessions révoquées ou expirées, la modification du mot de passe et la suppression du compte avec nettoyage des images.
- Les six opérations d’administration : refus sans session ou sans rôle admin, listes, statistiques d’analyses, quota IA indisponible et création de cours avec validation et conflit d’ordre.
- L’analyse d’une image avec conversion WebP réelle en mémoire, les erreurs IA, le refus des uploads trop volumineux, les recommandations et la limite de galerie.
- La lecture des images privées et la cohérence des sauvegardes/suppressions lors d’un échec SQL ou Blob.
- Le service Gemini avec `fetch` simulé : requête, clé manquante, indisponibilité, erreurs HTTP/réseau, réponses vides et JSON invalide.
- Swagger : correspondance avec les routes, références de schémas, déclaration des accès et chargement des assets avec la politique CSP.

Les tests frontend utilisent jsdom et React Testing Library : authentification, sessions, formulaires de connexion/inscription, récupération du mot de passe et consentement analytics. Aucun script Google ni appel API réel n’est exécuté.

Ces tests ne remplacent pas une validation d’intégration avec une base dédiée ou un parcours complet dans un navigateur. En particulier, les données de cours et leur tri SQL ne sont plus vérifiés contre une base réelle par la suite unitaire.

Autres vérifications frontend : `npm run build` et `npm run lint`.
