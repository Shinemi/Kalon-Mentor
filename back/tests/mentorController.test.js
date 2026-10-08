'use strict'

const request = require('supertest')
const sharp = require('sharp')
const app = require('../app')
const db = require('../db/db')

const TEST_EMAIL = 'test.mentor@kalonmentor.local'
const TEST_PASSWORD = 'motdepasse123!'

let token

beforeAll(async () => {
    await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL])

    const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'mentor-tester', email: TEST_EMAIL, password: TEST_PASSWORD })

    token = response.body.token
})

afterAll(async () => {
    await db.query(
        'DELETE FROM corrections WHERE user_id IN (SELECT id FROM users WHERE email = $1)',
        [TEST_EMAIL]
    )
    await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL])
    await db.pool.end()
})

// Petite image générée à la volée pour les tests d'upload
async function createTestImage() {
    return sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
        .png()
        .toBuffer()
}

test('refuse l\'analyse sans token', async () => {
    const response = await request(app).post('/api/v1/mentor/correction')

    expect(response.status).toBe(401)
})

test('refuse l\'analyse sans image', async () => {
    const response = await request(app)
        .post('/api/v1/mentor/correction')
        .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
})

test('refuse un fichier qui n\'est pas une image', async () => {
    const response = await request(app)
        .post('/api/v1/mentor/correction')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('ceci est un texte'), 'notes.txt')

    expect(response.status).toBe(400)
})

test('la galerie est vide au départ', async () => {
    const response = await request(app)
        .get('/api/v1/mentor/correctionGallery')
        .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.corrections).toHaveLength(0)
})

test('sauvegarde une correction puis la retrouve dans la galerie', async () => {
    const imageBuffer = await createTestImage()

    // Feedback minimal mais structurellement valide (pas de ressource
    // recommandée ici, pour ne pas dépendre d'un ID réel de ta table resources)
    const fakeFeedback = {
        resume: 'Nice line work, try varying your line weight.',
        score_global: 65,
        ressources_recommandees: [],
    }

    const saveResponse = await request(app)
        .post('/api/v1/mentor/correctionSave')
        .set('Authorization', `Bearer ${token}`)
        .send({
            image: imageBuffer.toString('base64'),
            feedback: fakeFeedback,
        })

    expect(saveResponse.status).toBe(201)
    expect(saveResponse.body.correction.image_url).toBeDefined()

    const galleryResponse = await request(app)
        .get('/api/v1/mentor/correctionGallery')
        .set('Authorization', `Bearer ${token}`)

    expect(galleryResponse.body.corrections).toHaveLength(1)
})

test('refuse la sauvegarde sans feedback', async () => {
    const imageBuffer = await createTestImage()

    const response = await request(app)
        .post('/api/v1/mentor/correctionSave')
        .set('Authorization', `Bearer ${token}`)
        .send({ image: imageBuffer.toString('base64') })

    expect(response.status).toBe(400)
})

test('refuse la sauvegarde sans image', async () => {
    const response = await request(app)
        .post('/api/v1/mentor/correctionSave')
        .set('Authorization', `Bearer ${token}`)
        .send({ feedback: { resume: 'test' } })

    expect(response.status).toBe(400)
})

test('supprime une correction de la galerie', async () => {
    const galleryResponse = await request(app)
        .get('/api/v1/mentor/correctionGallery')
        .set('Authorization', `Bearer ${token}`)

    const correctionId = galleryResponse.body.corrections[0].id

    const deleteResponse = await request(app)
        .delete(`/api/v1/mentor/correctionDelete/${correctionId}`)
        .set('Authorization', `Bearer ${token}`)

    expect(deleteResponse.status).toBe(200)

    const afterResponse = await request(app)
        .get('/api/v1/mentor/correctionGallery')
        .set('Authorization', `Bearer ${token}`)

    expect(afterResponse.body.corrections).toHaveLength(0)
})