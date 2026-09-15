const request = require('supertest')
const app = require('../app')
const db = require('../db/db')

// Un email dédié aux tests, qu'on nettoie avant/après pour ne pas
// polluer la vraie table users avec de faux comptes à chaque exécution.
const TEST_EMAIL = 'test.jest@kalonmentor.local'
const TEST_PASSWORD = 'motdepasse123!'

beforeAll(async () => {
    await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL])
})

afterAll(async () => {
    await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL])
    await db.pool.end() // ferme la connexion à la base, sinon Jest ne se termine pas
})

test('inscription réussie renvoie un token', async () => {
    const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'jest-tester', email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(response.status).toBe(201)
    expect(response.body.token).toBeDefined()
})

test('inscription refusée si l\'email existe déjà', async () => {
    // Le compte créé au test précédent existe toujours en base ici
    const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'jest-tester', email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(response.status).toBe(409)
})

test('connexion réussie avec le bon mot de passe', async () => {
    const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
})

test('connexion refusée avec un mauvais mot de passe', async () => {
    const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: 'mauvais-mot-de-passe' })

    expect(response.status).toBe(401)
})

test('récupère le profil avec un token valide', async () => {
    // On se reconnecte pour récupérer un token frais
    const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    const token = loginResponse.body.token

    const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe(TEST_EMAIL)
})

test('refuse l\'accès au profil sans token', async () => {
    const response = await request(app).get('/api/v1/auth/profile')

    expect(response.status).toBe(401)
})

test('modifie le username du profil', async () => {
    const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    const token = loginResponse.body.token

    const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'jest-tester-modifie' })

    expect(response.status).toBe(200)
    expect(response.body.user.username).toBe('jest-tester-modifie')
})