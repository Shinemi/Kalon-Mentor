# Tests

Depuis `back/` : `npm test` (Jest).
Depuis `front/` : `npm test` (Vitest) ou `npm run test:watch`.
Installer les dépendances dans chaque dossier avec `npm ci`.

Les tests backend utilisent les routes Express et remplacent les modèles ainsi que les services externes par des mocks. Ils ne contactent ni PostgreSQL, ni Brevo, ni le stockage Blob, ni le service IA, et ne créent pas de fichiers d’upload. Les tests du modèle de récupération vérifient ses requêtes avec une connexion simulée.

Les tests frontend utilisent jsdom et React Testing Library : authentification, sessions, formulaires de connexion/inscription, récupération du mot de passe et consentement analytics. Aucun script Google ni appel API réel n’est exécuté.

Ces tests ne remplacent pas une validation d’intégration avec une base dédiée ou un parcours complet dans un navigateur. En particulier, les données de cours et leur tri SQL ne sont plus vérifiés contre une base réelle par la suite unitaire.

Autres vérifications frontend : `npm run build` et `npm run lint`.
