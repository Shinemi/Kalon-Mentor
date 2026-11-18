'use strict'

const { z } = require('zod')
const authSchemas = require('../schemas/authSchemas')
const { saveCorrectionSchema } = require('../schemas/mentorSchemas')
const { createCourseSchema, updateCourseSchema } = require('../schemas/courseSchemas')

const ref = name => ({ $ref: `#/components/schemas/${name}` })
const uuid = { type: 'string', format: 'uuid' }
const idParameter = { name: 'id', in: 'path', required: true, schema: uuid }
const categoryParameter = {
    name: 'category', in: 'query', required: false,
    description: 'Filtre facultatif. Une catégorie inconnue renvoie une liste vide.',
    schema: { type: 'string', example: 'perspective' }
}

// Les contraintes d'entrée sont produites depuis les validateurs utilisés par les routes.
function inputSchema(schema) {
    const result = z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' })
    // Zod émet encore contentEncoding pour z.base64(), absent d'OpenAPI 3.0.
    function normalize(value) {
        if (!value || typeof value !== 'object') return
        if (value.contentEncoding === 'base64') {
            value.format = 'byte'
            delete value.contentEncoding
        }
        Object.values(value).forEach(normalize)
    }
    normalize(result)
    return result
}

const schemas = {
    RegisterInput: inputSchema(authSchemas.registerSchema),
    LoginInput: inputSchema(authSchemas.loginSchema),
    UpdateProfileInput: inputSchema(authSchemas.updateProfileSchema),
    ForgotPasswordInput: inputSchema(authSchemas.forgotPasswordSchema),
    ResetPasswordInput: inputSchema(authSchemas.resetPasswordSchema),
    SaveCorrectionInput: inputSchema(saveCorrectionSchema),
    CreateCourseInput: inputSchema(createCourseSchema),
    UpdateCourseInput: { ...inputSchema(updateCourseSchema), minProperties: 1 }
}

// Les transformations trim/toLowerCase ne décrivent pas le format de sortie de la pipe Zod.
for (const name of ['RegisterInput', 'LoginInput', 'UpdateProfileInput', 'ForgotPasswordInput']) {
    schemas[name].properties.email = { type: 'string', format: 'email', example: 'artiste@example.com' }
}
schemas.UpdateProfileInput.minProperties = 1
schemas.RegisterInput.example = {
    username: 'artiste', email: 'artiste@example.com', password: 'Dessin123!',
    acceptedTerms: true, declaredAdult: true, termsVersion: '1.1'
}
schemas.LoginInput.example = { email: 'artiste@example.com', password: 'Dessin123!' }
schemas.SaveCorrectionInput.properties.image.description = 'Image en base64, sans préfixe data:.'

function operation(operationId, tag, summary, options = {}) {
    const { input, status = 200, access = 'public', errors = {}, ...details } = options
    const route = {
        operationId,
        tags: [tag],
        summary,
        security: access === 'public' ? [] : [{ bearerAuth: [] }],
        ...details,
        responses: {
            [status]: { description: status === 204 ? 'Succès, sans contenu.' : 'Succès.' },
            429: { description: 'Limite de requêtes atteinte.' },
            500: { description: 'Erreur interne du serveur.' }
        }
    }

    if (input) {
        route.requestBody = { required: true, content: { 'application/json': { schema: ref(input) } } }
        route.responses[400] = { description: 'JSON invalide.' }
        route.responses[413] = { description: 'Corps JSON supérieur à 5 Mo.' }
        route.responses[422] = { description: 'Données invalides.' }
    }
    if (access !== 'public') route.responses[401] = { description: 'JWT absent, invalide ou expiré.' }
    if (access === 'admin') route.responses[403] = { description: 'Rôle administrateur requis.' }

    for (const [statusCode, description] of Object.entries(errors)) {
        route.responses[statusCode] = { description }
    }
    return route
}

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'API Kalon Mentor', version: require('../package.json').version,
        description: 'Connectez-vous avec /auth/login puis collez le JWT dans Authorize. Les essais appellent réellement l’API et modifient les données.'
    },
    // Même origine que la documentation : fonctionne en local et sur le backend déployé.
    servers: [{ url: '/api/v1', description: 'Serveur courant' }],
    tags: [
        { name: 'Authentification', description: 'Comptes, connexion et récupération du mot de passe.' },
        { name: 'Ressources', description: 'Catalogue public de cours.' },
        { name: 'Mentor', description: 'Analyse de dessins et galerie personnelle.' },
        { name: 'Administration', description: 'Opérations réservées aux administrateurs.' }
    ],
    components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
        schemas
    },
    paths: {
        '/auth/register': { post: operation('register', 'Authentification', 'Créer un compte', {
            input: 'RegisterInput', status: 201,
            description: 'CGU acceptées et majorité déclarée obligatoires. Maximum 5 tentatives par IP en 15 minutes.',
            errors: { 409: 'Adresse e-mail déjà utilisée.' }
        }) },
        '/auth/login': { post: operation('login', 'Authentification', 'Se connecter', {
            input: 'LoginInput',
            description: 'Maximum 10 tentatives échouées par IP en 15 minutes.',
            errors: { 401: 'Adresse e-mail ou mot de passe incorrect.' }
        }) },
        '/auth/profile': {
            get: operation('getProfile', 'Authentification', 'Consulter son profil', { access: 'member' }),
            delete: operation('deleteAccount', 'Authentification', 'Supprimer son compte et ses sauvegardes', { access: 'member', status: 204 })
        },
        '/auth/profileUpdate': { put: operation('updateProfile', 'Authentification', 'Modifier son profil', {
            access: 'member', input: 'UpdateProfileInput',
            description: 'Au moins un champ requis. Un changement de mot de passe invalide les sessions existantes.'
        }) },
        '/auth/forgotPassword': { post: operation('forgotPassword', 'Authentification', 'Demander un lien de réinitialisation', {
            input: 'ForgotPasswordInput', status: 202,
            description: 'Réponse générique, même si le compte est inconnu. Maximum 5 demandes par IP en 15 minutes.'
        }) },
        '/auth/resetPassword': { post: operation('resetPassword', 'Authentification', 'Réinitialiser son mot de passe', {
            input: 'ResetPasswordInput',
            description: 'Lien à usage unique valable 30 minutes. Maximum 5 demandes par IP en 15 minutes.',
            errors: { 400: 'JSON invalide ou lien invalide, expiré ou déjà utilisé.' }
        }) },
        '/resources/courses': { get: operation('getCourses', 'Ressources', 'Lister les cours', {
            parameters: [categoryParameter],
        }) },
        '/resources/courses/{id}': { get: operation('getCourseById', 'Ressources', 'Consulter un cours', {
            parameters: [idParameter], errors: { 404: 'Cours introuvable.' }
        }) },
        '/mentor/correction': { post: operation('analyseCorrection', 'Mentor', 'Analyser un dessin', {
            access: 'member',
            description: 'Un fichier image de 10 Mo maximum. Renvoie le feedback et une image WebP en base64 ; ne sauvegarde pas le dessin dans la galerie.',
            requestBody: { required: true, content: { 'multipart/form-data': {
                schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } }
            } } },
            errors: { 400: 'Image absente, illisible, trop volumineuse, mauvais champ ou type de fichier refusé.',
                409: 'Une analyse est déjà en cours pour ce compte.',
                429: 'Quota atteint : 2 réussites par jour et 10 par mois civil en Europe/Paris, ou limite HTTP par IP.',
                503: 'Mentor temporairement indisponible.', 504: 'Délai de 120 secondes dépassé sans consommation du quota.' }
        }) },
        '/mentor/correctionSave': { post: operation('saveCorrection', 'Mentor', 'Sauvegarder une analyse', {
            access: 'member', input: 'SaveCorrectionInput', status: 201,
            description: 'Envoyer image et feedback reçus de /mentor/correction. Maximum 10 sauvegardes ; jusqu’à 3 ressources recommandées sont associées.',
            parameters: [{ name: 'Idempotency-Key', in: 'header', required: false, schema: uuid, description: 'Réutiliser analysisId pour rejouer une sauvegarde sans créer de doublon.' }],
            errors: { 403: 'Galerie pleine (maxCorrections : 10).' }
        }) },
        '/mentor/correctionGallery': { get: operation('getCorrections', 'Mentor', 'Consulter sa galerie', { access: 'member' }) },
        '/mentor/correctionDelete/{id}': { delete: operation('deleteCorrection', 'Mentor', 'Supprimer une analyse sauvegardée', {
            access: 'member', parameters: [idParameter], errors: { 404: 'Analyse introuvable pour ce compte.' }
        }) },
        '/admin/access': { get: operation('adminAccess', 'Administration', 'Vérifier son accès administrateur', { access: 'admin' }) },
        '/admin/users': { get: operation('getUsers', 'Administration', 'Lister les utilisateurs', {
            access: 'admin',
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000000, default: 1 } },
                { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }
            ], errors: { 422: 'Pagination invalide.' }
        }) },
        '/admin/courses/{id}': {
            patch: operation('updateCourse', 'Administration', 'Modifier les champs transmis d’un cours', {
                access: 'admin', parameters: [idParameter], input: 'UpdateCourseInput',
                errors: { 404: 'Cours introuvable.', 409: 'Ordre déjà utilisé dans la catégorie.' }
            }),
            delete: operation('retireCourse', 'Administration', 'Retirer un cours sans supprimer les références historiques', {
                access: 'admin', parameters: [idParameter], status: 204,
                errors: { 404: 'Cours introuvable.', 422: 'UUID invalide.' }
            })
        },
        '/admin/users/{id}/analyses': { get: operation('getUserAnalyses', 'Administration', 'Consulter le nombre et les dates des analyses réussies', {
            access: 'admin', parameters: [idParameter],
            errors: { 422: 'Identifiant utilisateur invalide.', 404: 'Utilisateur introuvable.' }
        }) },
        '/admin/ai/status': { get: operation('getAiStatus', 'Administration', 'Consulter les informations de quota IA', {
            access: 'admin',
            description: 'Rôle admin requis. Les quotas ne sont pas encore connectés : quotaAvailable vaut false et quota vaut null.'
        }) },
        '/admin/courses': {
            get: operation('getAdminCourses', 'Administration', 'Lister les cours depuis l’administration', {
                access: 'admin', parameters: [categoryParameter],
            }),
            post: operation('createCourse', 'Administration', 'Créer un cours', {
                access: 'admin', input: 'CreateCourseInput', status: 201,
                errors: { 409: 'Ordre déjà utilisé dans cette catégorie.' }
            })
        }
    }
}
