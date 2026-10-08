'use strict'

jest.mock('../models/userModel', () => ({
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
}))
jest.mock('../models/resourceModel', () => ({
    findCourseById: jest.fn(),
    findCourses: jest.fn(),
}))
jest.mock('../models/correctionModel', () => ({}))
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }))

const request = require('supertest')
const app = require('../app')
const userModel = require('../models/userModel')
const resourceModel = require('../models/resourceModel')
const jwt = require('jsonwebtoken')

function expectError(response, status) {
    expect(response.status).toBe(status)
    expect(response.body).toEqual({
        title: expect.any(String),
        statut: status,
        invalidParams: expect.any(Array),
    })
}

afterEach(() => jest.resetAllMocks())

test('validation Zod : 422 avec les champs invalides', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({})
    expectError(response, 422)
    expect(response.body.invalidParams).toContainEqual({ path: 'username', message: expect.any(String) })
})

test('authentification requise : 401', async () => {
    expectError(await request(app).get('/api/v1/auth/profile'), 401)
})

test('identifiants incorrects : 401', async () => {
    userModel.findUserByEmail.mockResolvedValue(null)
    expectError(await request(app).post('/api/v1/auth/login')
        .send({ email: 'artiste@example.com', password: 'incorrect' }), 401)
})

test('e-mail déjà utilisé : 409 avec le champ email', async () => {
    userModel.findUserByEmail.mockResolvedValue({ id: 1 })
    const response = await request(app).post('/api/v1/auth/register')
        .send({ username: 'artiste', email: 'artiste@example.com', password: 'dessin123!' })
    expectError(response, 409)
    expect(response.body.invalidParams[0].path).toBe('email')
})

test('cours introuvable : 404', async () => {
    resourceModel.findCourseById.mockResolvedValue(null)
    expectError(await request(app).get('/api/v1/resources/courses/1'), 404)
})

test('erreur serveur : 500 sans divulguer le détail interne', async () => {
    resourceModel.findCourses.mockRejectedValue(new Error('secret interne'))
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
        const response = await request(app).get('/api/v1/resources/courses')
        expectError(response, 500)
        expect(JSON.stringify(response.body)).not.toContain('secret interne')
    } finally {
        log.mockRestore()
    }
})

test('JSON mal formé : 400', async () => {
    expectError(await request(app).post('/api/v1/auth/login')
        .set('Content-Type', 'application/json').send('{'), 400)
})

test('corps trop volumineux : 413', async () => {
    expectError(await request(app).post('/api/v1/auth/login')
        .send({ padding: 'a'.repeat(5 * 1024 * 1024) }), 413)
})

test('route inconnue : 404', async () => {
    expectError(await request(app).get('/api/v1/inconnue'), 404)
})

test.each([
    ['image', 'text/plain', 'dessin.txt'],
    ['autreChamp', 'image/png', 'dessin.png'],
])('erreur upload : 400 (%s)', async (field, contentType, filename) => {
    jwt.verify.mockReturnValue({ id: 1 })
    userModel.findUserById.mockResolvedValue({ id: 1 })
    const response = await request(app).post('/api/v1/mentor/correction')
        .set('Authorization', 'Bearer test')
        .attach(field, Buffer.from('contenu'), { filename, contentType })
    expectError(response, 400)
    expect(response.body.invalidParams[0].path).toBe(field)
})

test('limite de requêtes : 429 au même format', async () => {
    let response
    for (let i = 0; i < 101; i++) {
        response = await request(app).get('/inconnue')
        if (response.status === 429) break
    }
    expectError(response, 429)
})
