'use strict'

jest.mock('../models/resourceModel', () => ({
    findCourses: jest.fn(),
    findCourseById: jest.fn()
}))
jest.mock('../models/userModel', () => ({}))
jest.mock('../models/correctionModel', () => ({}))

const request = require('supertest')
const app = require('../app')
const resources = require('../models/resourceModel')

beforeEach(() => jest.resetAllMocks())

test.each([undefined, 'anatomie', 'inconnue'])('transmet le filtre de catégorie : %s', async category => {
    const courses = category === 'inconnue' ? [] : [{
        id: 'cours',
        category: category || 'perspective',
        title: 'Les bases'
    }]
    resources.findCourses.mockResolvedValue(courses)

    const response = await request(app)
        .get('/api/v1/resources/courses').query(category ? { category } : {})

    expect(response.status).toBe(200)
    expect(response.body.courses).toEqual(courses)
    expect(resources.findCourses).toHaveBeenCalledWith(category)
})

test('retourne le détail du cours demandé', async () => {
    const course = {
        id: 'cours',
        content: { lesson: 'Perspective' }
    }
    resources.findCourseById.mockResolvedValue(course)

    const response = await request(app)
        .get('/api/v1/resources/courses/cours')

    expect(response.status).toBe(200)
    expect(response.body.course).toEqual(course)
    expect(resources.findCourseById).toHaveBeenCalledWith('cours')
})

test('retourne 404 pour un cours absent', async () => {
    resources.findCourseById.mockResolvedValue(null)

    expect((await request(app)
        .get('/api/v1/resources/courses/absent')).status).toBe(404)
})

test.each(['liste', 'détail'])('masque une panne de base : %s', async mode => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => { })
    try {
        resources[mode === 'liste' ? 'findCourses' : 'findCourseById'].mockRejectedValue(new Error('secret base'))

        const response = await request(app)
            .get(`/api/v1/resources/courses${mode === 'liste' ? '' : '/cours'}`)

        expect(response.status).toBe(500)
        expect(JSON.stringify(response.body)).not.toContain('secret base')
    } finally {
        log.mockRestore()
    }
})
