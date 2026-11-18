'use strict'

jest.mock('../models/userModel', () => ({ findUserById: jest.fn(), recordActivity: jest.fn() }))
jest.mock('../models/correctionModel', () => ({
    countCorrectionsByUser: jest.fn(),
    createSaveCorrection: jest.fn(),
    findCorrectionsByUser: jest.fn(),
    findCorrectionById: jest.fn(),
    deleteCorrection: jest.fn()
}))
jest.mock('../models/resourceModel', () => ({ resourceExists: jest.fn(), findAllResources: jest.fn() }))
jest.mock('../models/analysisModel', () => ({ reserveAnalysis: jest.fn(), finishAnalysis: jest.fn(), releaseAnalysis: jest.fn() }))
jest.mock('../services/imageStorage', () => ({ saveImage: jest.fn() }))
jest.mock('../services/aiService', () => ({ analyseDrawing: jest.fn() }))
jest.mock('@vercel/blob', () => ({
    get: jest.fn(),
    del: jest.fn()
}))

const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')
const users = require('../models/userModel')
const corrections = require('../models/correctionModel')
const storage = require('../services/imageStorage')
const blob = require('@vercel/blob')
const sharp = require('sharp')
const resources = require('../models/resourceModel')
const analyses = require('../models/analysisModel')
const ai = require('../services/aiService')

let token
const payload = {
    image: Buffer.from('dessin').toString('base64'),
    feedback: {
        resume: 'Travaillez les ombres',
        score_global: 65,
        ressources_recommandees: []
    }
}

beforeEach(() => {
    jest.resetAllMocks()
    process.env.JWT_SECRET = 'secret-exclusivement-pour-les-tests'
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET)
    users.findUserById.mockResolvedValue({ id: 1 })
    corrections.countCorrectionsByUser.mockResolvedValue(0)
    analyses.reserveAnalysis.mockResolvedValue({ allowed: true })
    analyses.finishAnalysis.mockResolvedValue(true)
    analyses.releaseAnalysis.mockResolvedValue()
    jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

function auth(req) {
    return req.set('Authorization', `Bearer ${token}`)
}

test('refuse une analyse sans token', async () => {
    const response = await request(app)
        .post('/api/v1/mentor/correction')

    expect(response.status).toBe(401)
})

test('refuse une analyse sans image', async () => {
    const response = await auth(request(app).post('/api/v1/mentor/correction'))

    expect(response.status).toBe(400)
})

test('refuse un fichier texte', async () => {
    const response = await auth(request(app).post('/api/v1/mentor/correction'))
        .attach('image', Buffer.from('texte'), 'notes.txt')

    expect(response.status).toBe(400)
})

test('renvoie une galerie vide et ses limites', async () => {
    corrections.findCorrectionsByUser.mockResolvedValue([])

    const response = await auth(request(app)
        .get('/api/v1/mentor/correctionGallery'))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
        corrections: [],
        savedCount: 0,
        maxCorrections: 10
    })
    expect(response.headers['cache-control']).toBe('private, no-store')
})

test('sauvegarde une correction pour la personne connectée', async () => {
    storage.saveImage.mockResolvedValue({ url: 'https://blob.test/dessin' })
    corrections.createSaveCorrection.mockResolvedValue({
        id: 1,
        image_url: 'https://blob.test/dessin'
    })

    const response = await auth(request(app)
        .post('/api/v1/mentor/correctionSave'))
        .send(payload)

    expect(response.status).toBe(201)
    expect(storage.saveImage).toHaveBeenCalledWith(Buffer.from('dessin'), 1)
    expect(corrections.createSaveCorrection).toHaveBeenCalledWith(
        1,
        'https://blob.test/dessin',
        JSON.stringify(payload.feedback),
        []
    )
})

test('refuse de dépasser dix corrections sans envoyer de fichier', async () => {
    corrections.countCorrectionsByUser.mockResolvedValue(10)

    const response = await auth(request(app)
        .post('/api/v1/mentor/correctionSave'))
        .send(payload)

    expect(response.status).toBe(403)
    expect(storage.saveImage).not.toHaveBeenCalled()
})

test.each([
    { image: payload.image },
    { feedback: payload.feedback },
    {
        ...payload,
        image: 'invalide!'
    }
])('refuse un corps invalide : %j', async body => {
    expect((await auth(request(app)
        .post('/api/v1/mentor/correctionSave'))
        .send(body)).status).toBe(422)
    expect(storage.saveImage).not.toHaveBeenCalled()
})

test.each([true, false])('supprime uniquement une correction appartenant au compte : %s', async exists => {
    corrections.findCorrectionById.mockResolvedValue(
        exists ? { image_url: 'https://blob.test/dessin' } : null
    )

    const response = await auth(request(app)
        .delete('/api/v1/mentor/correctionDelete/7'))

    expect(response.status).toBe(exists ? 200 : 404)
    expect(corrections.findCorrectionById).toHaveBeenCalledWith('7', 1)

    if (exists) {
        expect(blob.del).toHaveBeenCalledWith(
            'https://blob.test/dessin',
            expect.any(Object)
        )

        expect(corrections.deleteCorrection).toHaveBeenCalledWith('7', 1)

        expect(blob.del.mock.invocationCallOrder[0]).toBeLessThan(
            corrections.deleteCorrection.mock.invocationCallOrder[0]
        )
    } else {
        expect(blob.del).not.toHaveBeenCalled()
        expect(corrections.deleteCorrection).not.toHaveBeenCalled()
    }
})

async function analyse() {
    const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ffffff' } }).png().toBuffer()
    return auth(request(app).post('/api/v1/mentor/correction')).attach('image', image, 'dessin.png')
}

test('analyse une image et compte la réussite sans sauvegarder le dessin', async () => {
    const catalogue = [{ id: 'cours', title: 'Les ombres' }]
    resources.findAllResources.mockResolvedValue(catalogue)
    const feedback = {
        ...payload.feedback,
        analyse: Object.fromEntries(['anatomie', 'perspective', 'composition', 'couleurs', 'lumiere'].map(key => [key, {
            score: null, commentaire: 'Non évaluable sur ce dessin.', points_forts: [], problemes: [], competences_a_travailler: []
        }]))
    }
    ai.analyseDrawing.mockResolvedValue(feedback)
    const response = await analyse()
    expect(response.status).toBe(200)
    expect(response.body.feedback).toEqual(feedback)
    const sentImage = ai.analyseDrawing.mock.calls[0][0]
    expect((await sharp(sentImage).metadata()).format).toBe('webp')
    expect(ai.analyseDrawing.mock.calls[0][1]).toEqual(catalogue)
    expect((await sharp(Buffer.from(response.body.image, 'base64')).metadata()).format).toBe('webp')
    expect(analyses.finishAnalysis).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9-]{36}$/), 1, expect.any(AbortSignal))
    expect(storage.saveImage).not.toHaveBeenCalled()
    expect(corrections.createSaveCorrection).not.toHaveBeenCalled()
})

test.each(['indisponible', 'erreur', 'feedback invalide'])('ne compte pas une analyse en échec : %s', async kind => {
    resources.findAllResources.mockResolvedValue([])
    if (kind === 'feedback invalide') ai.analyseDrawing.mockResolvedValue({ resume: '' })
    else ai.analyseDrawing.mockRejectedValue(Object.assign(new Error('secret IA'), kind === 'indisponible' ? { code: 'AI_UNAVAILABLE' } : {}))
    const response = await analyse()
    expect(response.status).toBe(kind === 'indisponible' ? 503 : 500)
    expect(analyses.finishAnalysis).not.toHaveBeenCalled()
    expect(storage.saveImage).not.toHaveBeenCalled()
    expect(JSON.stringify(response.body)).not.toContain('secret IA')
})

test('ne lance pas l’IA pour un contenu qui n’est pas une image décodable', async () => {
    const response = await auth(request(app).post('/api/v1/mentor/correction'))
        .attach('image', Buffer.from('faux PNG'), 'dessin.png')
    expect(response.status).toBe(400)
    expect(ai.analyseDrawing).not.toHaveBeenCalled()
    expect(analyses.finishAnalysis).not.toHaveBeenCalled()
})

test('rejette une image au-delà des 10 Mo avant de lancer l’IA', async () => {
    const response = await auth(request(app).post('/api/v1/mentor/correction'))
        .attach('image', Buffer.alloc(10 * 1024 * 1024 + 1), 'dessin.png')
    expect(response.status).toBe(400)
    expect(response.body.invalidParams[0].path).toBe('image')
    expect(ai.analyseDrawing).not.toHaveBeenCalled()
})

test('associe au maximum trois ressources existantes, dans l’ordre de priorité', async () => {
    const ids = Array.from({ length: 5 }, (_, i) => `00000000-0000-4000-8000-00000000000${i}`)
    resources.resourceExists.mockImplementation(async id => id !== ids[0])
    storage.saveImage.mockResolvedValue({ url: 'https://blob.test/dessin' })
    corrections.createSaveCorrection.mockResolvedValue({ id: 1 })
    const feedback = {
        ...payload.feedback,
        ressources_recommandees: [4, 2, 0, 3, 1].map(i => ({ ressource_id: ids[i], priorite: i + 1 }))
    }
    await auth(request(app).post('/api/v1/mentor/correctionSave')).send({ ...payload, feedback }).expect(201)
    expect(corrections.createSaveCorrection).toHaveBeenCalledWith(1, 'https://blob.test/dessin',
        JSON.stringify({ ...feedback, ressources_recommandees: feedback.ressources_recommandees.filter(item => ids.slice(1, 4).includes(item.ressource_id)) }), ids.slice(1, 4))
    expect(resources.resourceExists).not.toHaveBeenCalledWith(ids[4])
})

test.each([false, true])('nettoie un Blob après un échec SQL, même si le nettoyage échoue : %s', async cleanupFails => {
    storage.saveImage.mockResolvedValue({ url: 'https://blob.test/orphelin', pathname: 'dessin.webp' })
    corrections.createSaveCorrection.mockRejectedValue(new Error('secret SQL'))
    if (cleanupFails) blob.del.mockRejectedValue(new Error('secret Blob'))
    const response = await auth(request(app).post('/api/v1/mentor/correctionSave')).send(payload).expect(500)
    expect(blob.del).toHaveBeenCalledWith('https://blob.test/orphelin', expect.any(Object))
    expect(JSON.stringify(response.body)).not.toContain('secret')
})

test('ne crée pas de correction si le stockage de l’image échoue', async () => {
    storage.saveImage.mockRejectedValue(new Error('secret Blob'))
    await auth(request(app).post('/api/v1/mentor/correctionSave')).send(payload).expect(500)
    expect(corrections.createSaveCorrection).not.toHaveBeenCalled()
    expect(blob.del).not.toHaveBeenCalled()
})

test('récupère les images privées de la galerie et tolère une image absente', async () => {
    corrections.findCorrectionsByUser.mockResolvedValue([
        { id: 1, image_url: 'https://blob.test/present' },
        { id: 2, image_url: 'https://blob.test/absent' }
    ])
    blob.get.mockResolvedValueOnce({ statusCode: 200, stream: new Response(Buffer.from('webp-test')).body })
        .mockResolvedValueOnce({ statusCode: 404 })
    const response = await auth(request(app).get('/api/v1/mentor/correctionGallery')).expect(200)
    expect(response.body.corrections.map(correction => correction.image)).toEqual([Buffer.from('webp-test').toString('base64'), ''])
    expect(response.body.savedCount).toBe(2)
    expect(blob.get).toHaveBeenCalledWith('https://blob.test/present', expect.objectContaining({ access: 'private' }))
    expect(corrections.findCorrectionsByUser).toHaveBeenCalledWith(1)
    expect(response.headers['cache-control']).toBe('private, no-store')
})

test('retourne une erreur si la lecture privée du Blob échoue', async () => {
    corrections.findCorrectionsByUser.mockResolvedValue([{ id: 1, image_url: 'https://blob.test/dessin' }])
    blob.get.mockResolvedValue({ statusCode: 500 })
    const response = await auth(request(app).get('/api/v1/mentor/correctionGallery')).expect(500)
    expect(response.body).not.toHaveProperty('corrections')
})

test('conserve la correction en base si la suppression du Blob échoue', async () => {
    corrections.findCorrectionById.mockResolvedValue({ image_url: 'https://blob.test/dessin' })
    blob.del.mockRejectedValue(new Error('secret Blob'))
    const response = await auth(request(app).delete('/api/v1/mentor/correctionDelete/7')).expect(500)
    expect(corrections.deleteCorrection).not.toHaveBeenCalled()
    expect(JSON.stringify(response.body)).not.toContain('secret Blob')
})

test.each([['busy', 409], ['daily', 429], ['monthly', 429]])('refuse avant tout appel IA une réservation %s', async (reason, status) => {
    analyses.reserveAnalysis.mockResolvedValue({ allowed: false, reason })
    const response = await analyse()
    expect(response.status).toBe(status)
    expect(response.body.reason).toBe(reason)
    expect(ai.analyseDrawing).not.toHaveBeenCalled()
    expect(analyses.finishAnalysis).not.toHaveBeenCalled()
})

test('interrompt une analyse après 120 secondes et libère la réservation sans réussite', async () => {
    const realTimeout = global.setTimeout
    let expire
    jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay, ...args) => {
        if (delay === 120000) expire = () => callback(...args)
        return realTimeout(callback, delay, ...args)
    })
    let started
    const ready = new Promise(resolve => { started = resolve })
    ai.analyseDrawing.mockImplementation(() => {
        started()
        return new Promise(() => {})
    })
    resources.findAllResources.mockResolvedValue([])
    const pending = analyse()
    await ready
    expire()
    const response = await pending
    expect(response.status).toBe(504)
    expect(ai.analyseDrawing.mock.calls[0][2].aborted).toBe(true)
    expect(analyses.finishAnalysis).not.toHaveBeenCalled()
    expect(analyses.releaseAnalysis).toHaveBeenCalledTimes(1)
})

test('compense le Blob si une sauvegarde concurrente a pris la dernière place', async () => {
    storage.saveImage.mockResolvedValue({ url: 'https://blob.test/en-trop' })
    corrections.createSaveCorrection.mockRejectedValue(Object.assign(new Error('Galerie pleine'), { code: 'GALLERY_FULL' }))
    const response = await auth(request(app).post('/api/v1/mentor/correctionSave')).send(payload).expect(403)
    expect(response.body.maxCorrections).toBe(10)
    expect(blob.del).toHaveBeenCalledWith('https://blob.test/en-trop', expect.any(Object))
})

test('dédoublonne les recommandations avant sauvegarde', async () => {
    const id = '00000000-0000-4000-8000-000000000001'
    resources.resourceExists.mockResolvedValue(true)
    storage.saveImage.mockResolvedValue({ url: 'https://blob.test/dessin' })
    corrections.createSaveCorrection.mockResolvedValue({ id: 1 })
    await auth(request(app).post('/api/v1/mentor/correctionSave')).send({
        ...payload, feedback: { ...payload.feedback, ressources_recommandees: [{ ressource_id: id }, { ressource_id: id }] }
    }).expect(201)
    expect(corrections.createSaveCorrection.mock.calls[0][3]).toEqual([id])
    expect(JSON.parse(corrections.createSaveCorrection.mock.calls[0][2]).ressources_recommandees).toHaveLength(1)
})

test('rejoue une sauvegarde confirmée sans nouvel upload, même si la galerie est pleine', async () => {
    const key = '11111111-1111-4111-8111-111111111111'
    corrections.findCorrectionById.mockResolvedValue({ id: key, image_url: 'https://blob.test/existant' })
    corrections.countCorrectionsByUser.mockResolvedValue(10)
    const response = await auth(request(app).post('/api/v1/mentor/correctionSave'))
        .set('Idempotency-Key', key).send(payload).expect(201)
    expect(response.body.correction.id).toBe(key)
    expect(storage.saveImage).not.toHaveBeenCalled()
    expect(corrections.createSaveCorrection).not.toHaveBeenCalled()
    expect(response.body.correction).not.toHaveProperty('image_url')
})

test('ne retourne pas les adresses de stockage ni les champs internes dans la galerie', async () => {
    corrections.findCorrectionsByUser.mockResolvedValue([{
        id: 'correction', image_url: 'https://blob.test/chemin-interne', user_id: 'compte-interne',
        unexpected_secret: 'valeur-fictive', feedback_text: '{"resume":"Mon analyse"}', created_at: '2026-11-18T00:00:00Z'
    }])
    blob.get.mockResolvedValue({ statusCode: 404 })
    const response = await auth(request(app).get('/api/v1/mentor/correctionGallery')).expect(200)
    expect(response.body.corrections[0]).toEqual({
        id: 'correction', image: '', feedback_text: '{"resume":"Mon analyse"}', created_at: '2026-11-18T00:00:00Z'
    })
    expect(JSON.stringify(response.body)).not.toContain('chemin-interne')
})
