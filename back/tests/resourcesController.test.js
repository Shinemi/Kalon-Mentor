'use strict'

const request = require('supertest')
const app = require('../app')
const db = require('../db/db')

afterAll(async () => {
    await db.pool.end()
})

describe('GET /api/v1/resources/courses', () => {
    test('renvoie tous les cours', async () => {
        const response = await request(app).get('/api/v1/resources/courses')

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.courses)).toBe(true)
        expect(response.body.courses.length).toBeGreaterThanOrEqual(48)

        const sample = response.body.courses[0]
        expect(sample).toHaveProperty('id')
        expect(sample).toHaveProperty('title')
        expect(sample).toHaveProperty('category')
    })

    test('filtre par catégorie', async () => {
        const response = await request(app).get('/api/v1/resources/courses?category=anatomie')

        expect(response.status).toBe(200)
        expect(response.body.courses.length).toBe(8)
        response.body.courses.forEach((course) => {
            expect(course.category).toBe('anatomie')
        })
    })

    test('les cours d\'une catégorie sont triés par ordre pédagogique croissant', async () => {
        const response = await request(app).get('/api/v1/resources/courses?category=lumiere')

        const orders = response.body.courses.map((course) => course.order_index)
        const sorted = [...orders].sort((a, b) => a - b)
        expect(orders).toEqual(sorted)
    })

    test('une catégorie inconnue renvoie une liste vide (pas une erreur)', async () => {
        const response = await request(app).get('/api/v1/resources/courses?category=inconnue')

        expect(response.status).toBe(200)
        expect(response.body.courses).toHaveLength(0)
    })
})

describe('GET /api/v1/resources/courses/:id', () => {
    let sampleCourseId

    // On récupère un vrai ID existant en base plutôt que d'en inventer un,
    // puisque les UUID sont générés aléatoirement à l'insertion.
    beforeAll(async () => {
        const { rows } = await db.query(
            `SELECT id FROM resources WHERE category = 'perspective' LIMIT 1`
        )
        sampleCourseId = rows[0].id
    })

    test('renvoie le détail complet d\'un cours existant', async () => {
        const response = await request(app).get(`/api/v1/resources/courses/${sampleCourseId}`)

        expect(response.status).toBe(200)
        expect(response.body.course.id).toBe(sampleCourseId)
        expect(response.body.course.content).toHaveProperty('lesson')
        expect(response.body.course.content).toHaveProperty('objectives')
        expect(response.body.course.content).toHaveProperty('exercise')
        expect(response.body.course.content).toHaveProperty('commonMistakes')
    })

    test('renvoie 404 pour un id inexistant', async () => {
        const response = await request(app).get(
            '/api/v1/resources/courses/00000000-0000-0000-0000-000000000000'
        )

        expect(response.status).toBe(404)
    })
})