# Mot de passe oublié avec Brevo

Cette modification ajoute un parcours complet de récupération de mot de passe au MVP existant. Aucun abonnement à une newsletter ni bibliothèque d’envoi supplémentaire n’est ajouté : le back utilise son `fetch` natif pour appeler l’API HTTPS Brevo.

## Installation

1. Exécuter le contenu de `back/sql/password-reset.sql` dans le SQL Editor du projet Supabase. Le script ajoute trois colonnes et un index, sans supprimer les comptes. Il peut être rejoué. Cette étape doit précéder le déploiement du back : ses requêtes utilisent désormais `token_version`.
2. Ajouter les variables ci-dessous au `.env` du back et au service Render. L’adresse doit être celle de l’expéditeur vérifié dans Brevo. Ne pas copier ces variables dans le front.
3. En local, utiliser `FRONTEND_URL=http://localhost:5173`. Sur Render, utiliser l’adresse publique du front.
4. Redémarrer le back et déployer le front avec les nouvelles routes. La configuration Vercel existante doit continuer à rediriger les routes du front vers `index.html`.

```env
BREVO_API_KEY=VOTRE_CLE_API
BREVO_SENDER_EMAIL=kalon-mentor@gmail.com
BREVO_SENDER_NAME=Kalon Mentor
FRONTEND_URL=https://kalon-mentor.vercel.app
```

Il faut une clé API autorisant les e-mails transactionnels, pas une clé SMTP. Vérifier également que le compte Brevo autorise l’envoi et que les paramètres de suivi des e-mails correspondent à vos choix de confidentialité. Le code ne configure pas le compte Brevo à distance et n’annonce pas de désactivation du suivi côté fournisseur.

## Parcours

Le lien « Mot de passe oublié ? » de la connexion mène à `/forgot-password`. Ce formulaire appelle `POST /api/v1/auth/forgotPassword` avec `{ email }`.

Le back recherche le compte, génère un jeton, enregistre son empreinte et envoie un lien de 30 minutes via Brevo. Il répond avec le même message que l’adresse corresponde ou non à un compte. Un refus de Brevo est journalisé sous un code et un statut, sans exposer de lien secret. L’empreinte correspondante est alors retirée pour permettre une nouvelle demande.

Le lien ouvre `/reset-password#token=...`. La page garde le jeton en mémoire, puis le retire de la barre d’adresse. Un rechargement de la page perd ce jeton : rouvrir le lien de l’e-mail s’il est encore valide. Aucun changement de mot de passe n’a lieu lors de la simple ouverture du lien ; il faut soumettre le formulaire.

Le formulaire appelle `POST /api/v1/auth/resetPassword` avec `{ token, password }`. Le serveur remplace le mot de passe et consomme le jeton dans une seule requête SQL. L’utilisateur retourne ensuite à la connexion, sans connexion automatique.

## Choix et syntaxes

- `crypto.randomBytes(32)` produit 32 octets aléatoires. `.toString('hex')` les représente par 64 caractères utilisables dans un lien.
- `crypto.createHash('sha256').update(token).digest('hex')` calcule l’empreinte du jeton. La BDD ne conserve pas le secret présent dans l’e-mail.
- Le mot de passe est traité avec bcrypt, comme à l’inscription. Le schéma `registerSchema.shape.password` réutilise les règles Zod déjà définies pour ce champ.
- `INTERVAL '30 minutes'` donne la durée de validité en SQL. Une condition supplémentaire refuse de remplacer un lien demandé depuis moins d’une minute.
- `UPDATE ... WHERE ... RETURNING id` vérifie l’expiration, change le mot de passe et retire le lien en une opération. Deux demandes simultanées ne peuvent pas consommer le même jeton avec succès.
- `token_version` est un compteur du compte. Il augmente après une réinitialisation. Le middleware compare ce compteur à celui du JWT et refuse les sessions antérieures. Les anciens JWT sans compteur restent acceptés tant que la version du compte vaut zéro.
- Une modification de l’e-mail ou du mot de passe depuis le profil retire également les liens de récupération en attente.
- Les deux routes partagent une limite de 5 requêtes par IP sur 15 minutes, en mémoire du processus. Sur Render, Express fait confiance au proxy pour retrouver l’IP. Le code actuel vise une seule instance du back.
- Une attente minimale d’une seconde réduit l’écart de durée entre les réponses pour une adresse connue et inconnue ; elle ne garantit pas un temps strictement constant si un prestataire répond lentement.
- Le fragment après `#` reste côté navigateur lors de l’ouverture du lien. Le jeton est transmis ensuite au back dans le corps du POST. Analytics n’est pas chargé sur la page de réinitialisation.
- Une seule page React gère les deux modes, avec les styles et les states habituels du projet. Les attributs `key` dans les routes réinitialisent les champs quand on change de mode.

## Vérification

```sh
cd back
npm test -- --runInBand tests/passwordRecovery.test.js tests/emailService.test.js tests/authSchemas.test.js tests/updateProfileSchema.test.js
```

Les appels Brevo et les accès de production sont simulés dans les tests. Un contrôle supplémentaire sur PostgreSQL embarqué a vérifié le script SQL, l’expiration, le remplacement, la consommation unique concurrente et l’isolation entre comptes. Ce contrôle n’a modifié aucune base de production.

Pour tester réellement après configuration : demander un lien pour un compte de test, vérifier sa réception et les indésirables, changer le mot de passe, vérifier que l’ancien ne fonctionne plus, se connecter avec le nouveau puis vérifier que le même lien est refusé. Le test réel d’expédition n’a pas été exécuté pendant la préparation du code.
