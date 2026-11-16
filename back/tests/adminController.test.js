'use strict'

jest.mock('../models/userModel', () => ({ findUserById: jest.fn(), findUsers: jest.fn() }))
jest.mock('../models/analysisModel', () => ({ findAnalysisEventsByUser: jest.fn() }))
jest.mock('../models/resourceModel', () => ({ findCourses: jest.fn(), createCourse: jest.fn() }))

const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')
const users = require('../models/userModel')
const analyses = require('../models/analysisModel')
const resources = require('../models/resourceModel')

const adminId = '11111111-1111-4111-8111-111111111111'
const targetId = '22222222-2222-4222-8222-222222222222'
const course = {
    title: ' Perspective ', category: 'perspective', order_index: 1,
    content: { level: 'Débutant', lesson: 'Construire un cube', exercise: 'Dessiner un cube' }
}
const endpoints = [
    ['get', '/access'], ['get', '/users'], ['get', `/users/${targetId}/analyses`],
    ['get', '/ai/status'], ['get', '/courses'], ['post', '/courses']
]
let token

beforeEach(() => {
    jest.resetAllMocks()
    process.env.JWT_SECRET = 'secret-exclusivement-pour-les-tests'
    token = jwt.sign({ id: adminId, tokenVersion: 1 }, process.env.JWT_SECRET)
    users.findUserById.mockResolvedValue({ id: adminId, role: 'admin', token_version: 1 })
    jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

function auth(req) {
    return req.set('Authorization', `Bearer ${token}`)
}

test.each(endpoints)('refuse sans session : %s %s', async (method, path) => {
    await request(app)[method](`/api/v1/admin${path}`).expect(401)
    expect(users.findUsers).not.toHaveBeenCalled()
    expect(analyses.findAnalysisEventsByUser).not.toHaveBeenCalled()
    expect(resources.createCourse).not.toHaveBeenCalled()
    expect(resources.findCourses).not.toHaveBeenCalled()
})

test.each(endpoints)('refuse un membre sans rôle admin : %s %s', async (method, path) => {
    users.findUserById.mockResolvedValue({ id: adminId, role: 'member', token_version: 1 })
    const response = await auth(request(app)[method](`/api/v1/admin${path}`)).send(course)
    expect(response.status).toBe(403)
    expect(users.findUsers).not.toHaveBeenCalled()
    expect(analyses.findAnalysisEventsByUser).not.toHaveBeenCalled()
    expect(resources.createCourse).not.toHaveBeenCalled()
    expect(resources.findCourses).not.toHaveBeenCalled()
})

test('autorise un administrateur et retourne la liste sans cache partagé', async () => {
    await auth(request(app).get('/api/v1/admin/access')).expect(200)
    const list = [{ id: targetId, username: 'artiste', role: 'member' }]
    users.findUsers.mockResolvedValue(list)
    const response = await auth(request(app).get('/api/v1/admin/users')).expect(200)
    expect(response.body).toEqual({ users: list })
    expect(response.headers['cache-control']).toBe('private, no-store')
})

test('ne présente pas un quota IA inconnu comme disponible', async () => {
    const response = await auth(request(app).get('/api/v1/admin/ai/status')).expect(200)
    expect(response.body).toEqual({ quotaAvailable: false, quota: null, message: 'Information indisponible' })
    expect(response.headers['cache-control']).toBe('private, no-store')
})

test.each([{ events: [] }, { events: [{ created_at: new Date('2026-11-01T12:00:00Z') }] }])('retourne uniquement le total et les dates des analyses : %j', async ({ events }) => {
    users.findUserById.mockImplementation(async id => ({ id, role: 'admin', token_version: 1 }))
    analyses.findAnalysisEventsByUser.mockResolvedValue(events)
    const response = await auth(request(app).get(`/api/v1/admin/users/${targetId}/analyses`)).expect(200)
    expect(response.body).toEqual({ total: events.length, dates: events.map(event => event.created_at.toISOString()) })
    expect(analyses.findAnalysisEventsByUser).toHaveBeenCalledWith(targetId)
    expect(response.headers['cache-control']).toBe('private, no-store')
})

test('refuse un UUID invalide avant de chercher les analyses', async () => {
    const response = await auth(request(app).get('/api/v1/admin/users/invalide/analyses')).expect(422)
    expect(response.body.invalidParams[0].path).toBe('id')
    expect(users.findUserById).toHaveBeenCalledTimes(1)
    expect(analyses.findAnalysisEventsByUser).not.toHaveBeenCalled()
})

test('retourne 404 pour les analyses d’un utilisateur absent', async () => {
    users.findUserById.mockResolvedValueOnce({ id: adminId, role: 'admin', token_version: 1 }).mockResolvedValueOnce(null)
    await auth(request(app).get(`/api/v1/admin/users/${targetId}/analyses`)).expect(404)
    expect(analyses.findAnalysisEventsByUser).not.toHaveBeenCalled()
})

test('transmet le filtre de catégorie à la liste admin', async () => {
    resources.findCourses.mockResolvedValue([])
    const response = await auth(request(app).get('/api/v1/admin/courses?category=perspective')).expect(200)
    expect(response.body).toEqual({ courses: [] })
    expect(resources.findCourses).toHaveBeenCalledWith('perspective')
})

test('crée un cours après normalisation et applique les listes par défaut', async () => {
    resources.createCourse.mockResolvedValue({ id: targetId, ...course })
    const response = await auth(request(app).post('/api/v1/admin/courses')).send(course).expect(201)
    expect(response.body.course.id).toBe(targetId)
    expect(resources.createCourse).toHaveBeenCalledWith({
        ...course, title: 'Perspective', content: { ...course.content, objectives: [], commonMistakes: [] }
    })
})

test.each([
    { title: '' }, { category: 'inconnue' }, { order_index: 0 },
    { order_index: 1.5 }, { order_index: 2147483648 },
    { content: { level: 'Débutant' } }, { is_active: false }
])('refuse un cours invalide sans écriture : %j', async change => {
    const response = await auth(request(app).post('/api/v1/admin/courses')).send({ ...course, ...change }).expect(422)
    expect(response.body.invalidParams.length).toBeGreaterThan(0)
    expect(resources.createCourse).not.toHaveBeenCalled()
})

test('signale un ordre déjà utilisé dans la catégorie', async () => {
    resources.createCourse.mockRejectedValue({ code: '23505', constraint: 'resources_category_order_unique' })
    const response = await auth(request(app).post('/api/v1/admin/courses')).send(course).expect(409)
    expect(response.body.invalidParams[0].path).toBe('order_index')
})

test.each(['users', 'analyses', 'courses'])('masque une panne du modèle admin : %s', async kind => {
    const failure = new Error('secret de connexion')
    let req
    if (kind === 'users') {
        users.findUsers.mockRejectedValue(failure)
        req = request(app).get('/api/v1/admin/users')
    } else if (kind === 'analyses') {
        analyses.findAnalysisEventsByUser.mockRejectedValue(failure)
        req = request(app).get(`/api/v1/admin/users/${targetId}/analyses`)
    } else {
        resources.createCourse.mockRejectedValue(failure)
        req = request(app).post('/api/v1/admin/courses').send(course)
    }
    const response = await auth(req).expect(500)
    expect(response.body).toMatchObject({ statut: 500, invalidParams: [] })
    expect(JSON.stringify(response.body)).not.toContain('secret de connexion')
})
