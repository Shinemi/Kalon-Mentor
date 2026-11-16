'use strict'

const { z } = require('zod')
const authSchemas = require('../schemas/authSchemas')
const { saveCorrectionSchema, feedbackSchema } = require('../schemas/mentorSchemas')
const { createCourseSchema } = require('../schemas/courseSchemas')

const ref = name => ({ $ref: `#/components/schemas/${name}` })
const object = properties => ({ type: 'object', properties })
const array = items => ({ type: 'array', items })
const uuid = { type: 'string', format: 'uuid' }
const date = { type: 'string', format: 'date-time' }
const base64 = { type: 'string', format: 'byte', description: 'Image en base64, sans préfixe data:.' }
const json = schema => ({ 'application/json': { schema } })
const response = (description, schema) => ({ description, content: json(schema) })
const body = name => ({ required: true, content: json(ref(name)) })
const error = description => response(description, ref('ApiError'))
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
    Feedback: inputSchema(feedbackSchema),
    ApiError: {
        ...object({
            title: { type: 'string' },
            statut: { type: 'integer', example: 422 },
            invalidParams: array(object({ path: { type: 'string' }, message: { type: 'string' } })),
            maxCorrections: { type: 'integer', example: 10 }
        }),
        required: ['title', 'statut', 'invalidParams']
    },
    User: object({
        id: uuid, username: { type: 'string' }, email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['member', 'admin'] },
        avatar_url: { type: 'string', nullable: true }, created_at: date,
        token_version: { type: 'integer' }
    }),
    Message: object({ message: { type: 'string' } }),
    AuthResult: object({ user: ref('User'), token: { type: 'string', description: 'JWT valable 7 jours.' } }),
    ProfileResult: object({ user: ref('User') }),
    Course: object({
        id: uuid,
        ...inputSchema(createCourseSchema).properties,
        author_name: { type: 'string', nullable: true },
        type: { type: 'string', enum: ['course'] }, is_active: { type: 'boolean' }
    }),
    CourseResult: object({ course: ref('Course') }),
    CoursesResult: object({ courses: array(ref('Course')) }),
    Correction: object({
        id: uuid, image_url: { type: 'string' },
        feedback_text: { type: 'string', description: 'Feedback sérialisé en JSON.' },
        created_at: date
    }),
    GalleryCorrection: {
        allOf: [ref('Correction'), object({
            image: base64,
            resources: array(object({ resourceId: uuid, priority: { type: 'integer' } }))
        })]
    },
    GalleryResult: object({
        corrections: array(ref('GalleryCorrection')),
        savedCount: { type: 'integer' }, maxCorrections: { type: 'integer', example: 10 }
    }),
    AnalysisResult: object({ feedback: ref('Feedback'), image: base64 }),
    CorrectionResult: object({ correction: ref('Correction') }),
    UsersResult: object({ users: array(ref('User')) }),
    UserAnalysesResult: object({ total: { type: 'integer' }, dates: array(date) }),
    AiStatus: object({
        quotaAvailable: { type: 'boolean', enum: [false] },
        quota: { type: 'number', nullable: true, example: null, description: 'Toujours null : aucune source de quota connectée.' },
        message: { type: 'string', example: 'Information indisponible' }
    })
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
schemas.SaveCorrectionInput.properties.image = { ...schemas.SaveCorrectionInput.properties.image, ...base64 }

function operation(operationId, tag, summary, options = {}) {
    const { input, output, status = 200, access = 'public', errors = {}, ...details } = options
    return {
        operationId, tags: [tag], summary,
        security: access === 'public' ? [] : [{ bearerAuth: [] }],
        ...(access === 'admin' ? { description: 'Réservé aux comptes ayant le rôle admin.' } : {}),
        ...(input ? { requestBody: body(input) } : {}),
        ...details,
        responses: {
            [status]: output ? response('Succès.', ref(output)) : { description: 'Succès, sans contenu.' },
            ...(input ? {
                400: error('JSON invalide.'), 413: error('Corps JSON supérieur à 5 Mo.'),
                422: error('Données refusées par la validation.')
            } : {}),
            ...(access !== 'public' ? { 401: error('JWT absent, invalide ou expiré.') } : {}),
            ...(access === 'admin' ? { 403: error('Rôle administrateur requis.') } : {}),
            429: error('Limite HTTP atteinte : 100 requêtes par IP et par période de 15 minutes au maximum.'),
            500: error('Erreur interne du serveur.'),
            ...Object.fromEntries(Object.entries(errors).map(([code, description]) => [code, error(description)]))
        }
    }
}

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'API Kalon Mentor', version: require('../package.json').version,
        description: 'API de dessin et de mentorat. Connectez-vous avec POST /auth/login, puis collez le token dans Authorize. Les essais exécutent de vraies requêtes sur cet environnement. Les analyses sollicitent Gemini ; les sauvegardes et suppressions modifient vos données.'
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
            input: 'RegisterInput', output: 'AuthResult', status: 201,
            description: 'CGU acceptées et majorité déclarée obligatoires. Maximum 5 tentatives par IP en 15 minutes.',
            errors: { 409: 'Adresse e-mail déjà utilisée.' }
        }) },
        '/auth/login': { post: operation('login', 'Authentification', 'Se connecter', {
            input: 'LoginInput', output: 'AuthResult',
            description: 'Maximum 10 tentatives échouées par IP en 15 minutes.',
            errors: { 401: 'Adresse e-mail ou mot de passe incorrect.' }
        }) },
        '/auth/profile': {
            get: operation('getProfile', 'Authentification', 'Consulter son profil', { access: 'member', output: 'ProfileResult' }),
            delete: operation('deleteAccount', 'Authentification', 'Supprimer son compte et ses sauvegardes', { access: 'member', status: 204 })
        },
        '/auth/profileUpdate': { put: operation('updateProfile', 'Authentification', 'Modifier son profil', {
            access: 'member', input: 'UpdateProfileInput', output: 'ProfileResult',
            description: 'Au moins un champ requis. Un changement de mot de passe invalide les sessions existantes.'
        }) },
        '/auth/forgotPassword': { post: operation('forgotPassword', 'Authentification', 'Demander un lien de réinitialisation', {
            input: 'ForgotPasswordInput', output: 'Message', status: 202,
            description: 'Réponse générique, même si le compte est inconnu. Maximum 5 demandes par IP en 15 minutes.'
        }) },
        '/auth/resetPassword': { post: operation('resetPassword', 'Authentification', 'Réinitialiser son mot de passe', {
            input: 'ResetPasswordInput', output: 'Message',
            description: 'Lien à usage unique valable 30 minutes. Maximum 5 demandes par IP en 15 minutes.',
            errors: { 400: 'JSON invalide ou lien invalide, expiré ou déjà utilisé.' }
        }) },
        '/resources/courses': { get: operation('getCourses', 'Ressources', 'Lister les cours', {
            parameters: [categoryParameter], output: 'CoursesResult'
        }) },
        '/resources/courses/{id}': { get: operation('getCourseById', 'Ressources', 'Consulter un cours', {
            parameters: [idParameter], output: 'CourseResult', errors: { 404: 'Cours introuvable.' }
        }) },
        '/mentor/correction': { post: operation('analyseCorrection', 'Mentor', 'Analyser un dessin', {
            access: 'member', output: 'AnalysisResult',
            description: 'Un fichier image de 10 Mo maximum. Renvoie le feedback et une image WebP en base64 ; ne sauvegarde pas le dessin dans la galerie.',
            requestBody: { required: true, content: { 'multipart/form-data': {
                schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } }
            } } },
            errors: { 400: 'Image absente, trop volumineuse, mauvais champ ou type de fichier refusé.', 503: 'Mentor temporairement indisponible.' }
        }) },
        '/mentor/correctionSave': { post: operation('saveCorrection', 'Mentor', 'Sauvegarder une analyse', {
            access: 'member', input: 'SaveCorrectionInput', output: 'CorrectionResult', status: 201,
            description: 'Envoyer image et feedback reçus de /mentor/correction. Maximum 10 sauvegardes ; jusqu’à 3 ressources recommandées sont associées.',
            errors: { 403: 'Galerie pleine (maxCorrections : 10).' }
        }) },
        '/mentor/correctionGallery': { get: operation('getCorrections', 'Mentor', 'Consulter sa galerie', { access: 'member', output: 'GalleryResult' }) },
        '/mentor/correctionDelete/{id}': { delete: operation('deleteCorrection', 'Mentor', 'Supprimer une analyse sauvegardée', {
            access: 'member', parameters: [idParameter], output: 'Message', errors: { 404: 'Analyse introuvable pour ce compte.' }
        }) },
        '/admin/access': { get: operation('adminAccess', 'Administration', 'Vérifier son accès administrateur', { access: 'admin', output: 'Message' }) },
        '/admin/users': { get: operation('getUsers', 'Administration', 'Lister les utilisateurs', { access: 'admin', output: 'UsersResult' }) },
        '/admin/users/{id}/analyses': { get: operation('getUserAnalyses', 'Administration', 'Consulter le nombre et les dates des analyses réussies', {
            access: 'admin', parameters: [idParameter], output: 'UserAnalysesResult',
            errors: { 422: 'Identifiant utilisateur invalide.', 404: 'Utilisateur introuvable.' }
        }) },
        '/admin/ai/status': { get: operation('getAiStatus', 'Administration', 'Consulter les informations de quota IA', {
            access: 'admin', output: 'AiStatus',
            description: 'Rôle admin requis. Les quotas ne sont pas encore connectés : quotaAvailable vaut false et quota vaut null.'
        }) },
        '/admin/courses': {
            get: operation('getAdminCourses', 'Administration', 'Lister les cours depuis l’administration', {
                access: 'admin', parameters: [categoryParameter], output: 'CoursesResult'
            }),
            post: operation('createCourse', 'Administration', 'Créer un cours', {
                access: 'admin', input: 'CreateCourseInput', output: 'CourseResult', status: 201,
                errors: { 409: 'Ordre déjà utilisé dans cette catégorie.' }
            })
        }
    }
}
