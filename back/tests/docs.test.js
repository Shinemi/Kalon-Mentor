'use strict'

jest.mock('../db/db', () => ({ pool: { query: jest.fn() } }))

const request = require('supertest')
const app = require('../app')
const specification = require('../docs/openapi')

test('la spécification couvre exactement les opérations des routeurs de l’API', () => {
    const actual = []
    for (const group of ['auth', 'mentor', 'resource', 'admin']) {
        const prefix = group === 'resource' ? 'resources' : group
        const router = require(`../routes/${group}Routes`)
        for (const layer of router.stack) {
            if (!layer.route) continue
            const path = `/${prefix}${layer.route.path}`.replace(/:([^/]+)/g, '{$1}')
            for (const method of Object.keys(layer.route.methods)) actual.push(`${method} ${path}`)
        }
    }
    const documented = Object.entries(specification.paths).flatMap(([path, methods]) =>
        Object.keys(methods).map(method => `${method} ${path}`)
    )
    expect(documented.sort()).toEqual(actual.sort())
})

test('les références de schémas sont résolues et les operationId sont uniques', () => {
    const visit = value => {
        if (!value || typeof value !== 'object') return
        if (value.$ref) {
            const target = value.$ref.slice(2).split('/').reduce((node, key) => node?.[key], specification)
            expect(target).toBeDefined()
        }
        Object.values(value).forEach(visit)
    }
    visit(specification)
    const ids = Object.values(specification.paths).flatMap(methods =>
        Object.values(methods).map(operation => operation.operationId)
    )
    expect(new Set(ids).size).toBe(ids.length)
})

test('les routes privées et admin déclarent les accès JWT et les erreurs associées', () => {
    for (const [path, methods] of Object.entries(specification.paths)) {
        const protectedRoute = /^\/(mentor|admin)\//.test(path) || /\/auth\/(profile|profileUpdate)$/.test(path)
        for (const operation of Object.values(methods)) {
            expect(operation.security).toEqual(protectedRoute ? [{ bearerAuth: [] }] : [])
            if (protectedRoute) expect(operation.responses[401]).toBeDefined()
            if (path.startsWith('/admin/')) expect(operation.responses[403]).toBeDefined()
        }
    }
})

test('la documentation et ses assets sont servis avec une CSP compatible en HTTP', async () => {
    await request(app).get('/api-docs').expect(301)
    const page = await request(app).get('/api-docs/').expect(200).expect('Content-Type', /html/)
    expect(page.text).toContain('swagger-ui')
    expect(page.headers['content-security-policy']).toContain("script-src 'self'")
    expect(page.headers['content-security-policy']).not.toContain('upgrade-insecure-requests')
    await request(app).get('/api-docs/swagger-ui-bundle.js').expect(200).expect('Content-Type', /javascript/)
    const init = await request(app).get('/api-docs/swagger-ui-init.js').expect(200)
    expect(init.text).toContain('/api-docs.json')
    expect(init.text).toContain('"validatorUrl": null')
    expect(init.text).toContain('"persistAuthorization": false')
})

test('le JSON est public et les protections de l’API restent actives', async () => {
    const response = await request(app).get('/api-docs.json').expect(200).expect('Content-Type', /json/)
    expect(response.body.openapi).toBe('3.0.3')
    expect(response.body.servers).toEqual([{ url: '/api/v1', description: 'Serveur courant' }])
    const profile = await request(app).get('/api/v1/auth/profile').expect(401)
    expect(profile.headers['content-security-policy']).toContain('upgrade-insecure-requests')
})
