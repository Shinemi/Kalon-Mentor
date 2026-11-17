'use strict'

jest.mock('../db/db', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }))

const { PGlite } = require('@electric-sql/pglite')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { pool } = require('../db/db')
const analyses = require('../models/analysisModel')
const corrections = require('../models/correctionModel')
const resources = require('../models/resourceModel')
const users = require('../models/userModel')
const { updateCourseSchema } = require('../schemas/courseSchemas')
const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')

const userId = '11111111-1111-4111-8111-111111111111'
let db
let tail = Promise.resolve()

// PGlite est mono-connexion : ce pool sérialise les transactions comme un pool pg de taille 1.
// Les requêtes, contraintes et calculs de dates s'exécutent dans PostgreSQL, sans mocks SQL.
async function connect() {
    let release
    const previous = tail
    tail = new Promise(resolve => { release = resolve })
    await previous
    return { query: (sql, args) => db.query(sql, args), release }
}

beforeAll(async () => {
    db = new PGlite()
    await db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'))
    pool.connect.mockImplementation(connect)
    pool.query.mockImplementation(async (sql, args) => {
        const client = await connect()
        try { return await client.query(sql, args) } finally { client.release() }
    })
}, 30000)

beforeEach(async () => {
    await db.exec('TRUNCATE users, resources CASCADE')
    await db.query('INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)', [userId, 'artiste', 'artiste@example.test', 'hash-fictif'])
})

afterAll(async () => { await db?.close() })

test('reconstruit les six tables du dossier', async () => {
    const result = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    expect(result.rows.map(row => row.table_name).sort()).toEqual(['analysis_events', 'analysis_locks', 'corrections', 'corrections_resources', 'resources', 'users'])
})

test('une seule réservation partagée est acceptée pour deux demandes simultanées', async () => {
    const results = await Promise.all([analyses.reserveAnalysis(randomUUID(), userId), analyses.reserveAnalysis(randomUUID(), userId)])
    expect(results.filter(result => result.allowed)).toHaveLength(1)
    expect(results.find(result => !result.allowed).reason).toBe('busy')
})

test('un échec libère la réservation sans compter de réussite', async () => {
    const id = randomUUID()
    await analyses.reserveAnalysis(id, userId)
    await analyses.releaseAnalysis(id, userId)
    expect((await analyses.reserveAnalysis(randomUUID(), userId)).allowed).toBe(true)
    expect(await analyses.findAnalysisEventsByUser(userId)).toEqual([])
})

test('ne compte une réservation réussie qu’une fois', async () => {
    const id = randomUUID()
    await analyses.reserveAnalysis(id, userId)
    expect(await analyses.finishAnalysis(id, userId)).toBe(true)
    expect(await analyses.finishAnalysis(id, userId)).toBe(false)
    await analyses.createAnalysisEvent(id, userId)
    expect(await analyses.findAnalysisEventsByUser(userId)).toHaveLength(1)
})

test('refuse la troisième réussite quotidienne', async () => {
    for (let i = 0; i < 2; i++) await analyses.createAnalysisEvent(randomUUID(), userId)
    expect(await analyses.reserveAnalysis(randomUUID(), userId)).toEqual({ allowed: false, reason: 'daily' })
})

test('refuse une onzième réussite dans le mois, indépendamment du quota quotidien', async () => {
    await db.query(`INSERT INTO analysis_events (id, user_id, created_at)
        SELECT gen_random_uuid(), $1, date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
        FROM generate_series(1, 10)`, [userId])
    expect(await analyses.reserveAnalysis(randomUUID(), userId)).toEqual({ allowed: false, reason: 'monthly' })
})

test('ignore les réussites du mois précédent', async () => {
    await db.query(`INSERT INTO analysis_events (id, user_id, created_at)
        SELECT gen_random_uuid(), $1, (date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris') - INTERVAL '1 second'
        FROM generate_series(1, 12)`, [userId])
    expect((await analyses.reserveAnalysis(randomUUID(), userId)).allowed).toBe(true)
})

test.each([
    ['2026-03-29T12:00:00Z', '2026-03-28T23:00:00.000Z'],
    ['2026-03-30T12:00:00Z', '2026-03-29T22:00:00.000Z'],
    ['2026-10-25T12:00:00Z', '2026-10-24T22:00:00.000Z'],
    ['2026-10-26T12:00:00Z', '2026-10-25T23:00:00.000Z']
])('calcule minuit Europe/Paris au changement d’heure : %s', async (instant, start) => {
    const result = await db.query("SELECT date_trunc('day', $1::timestamptz AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris' AS start", [instant])
    expect(result.rows[0].start.toISOString()).toBe(start)
})

test('une ancienne requête expirée ne peut ni compter un succès ni libérer le nouveau verrou', async () => {
    const old = randomUUID()
    const current = randomUUID()
    await analyses.reserveAnalysis(old, userId)
    await db.query("UPDATE analysis_locks SET started_at = NOW() - INTERVAL '121 seconds', expires_at = NOW() - INTERVAL '1 second' WHERE user_id = $1", [userId])
    expect(await analyses.finishAnalysis(old, userId)).toBe(false)
    expect((await analyses.reserveAnalysis(current, userId)).allowed).toBe(true)
    await analyses.releaseAnalysis(old, userId)
    expect(await analyses.finishAnalysis(current, userId)).toBe(true)
    expect(await analyses.findAnalysisEventsByUser(userId)).toHaveLength(1)
})

test('la dixième sauvegarde passe, la onzième concurrente échoue', async () => {
    for (let i = 0; i < 9; i++) await corrections.createSaveCorrection(userId, 'https://blob.test/image', '{}')
    const results = await Promise.allSettled([
        corrections.createSaveCorrection(userId, 'https://blob.test/10', '{}'),
        corrections.createSaveCorrection(userId, 'https://blob.test/11', '{}')
    ])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find(result => result.status === 'rejected').reason.code).toBe('GALLERY_FULL')
    expect(await corrections.countCorrectionsByUser(userId)).toBe(10)
})

test('modifie partiellement un cours, conserve son contenu puis le retire sans casser ses références', async () => {
    const course = await resources.createCourse({
        title: 'Cours', category: 'perspective', order_index: 1,
        content: { level: 'débutant', lesson: 'Ancienne leçon', objectives: ['Objectif conservé'], exercise: 'Exercice' }
    })
    const correction = await corrections.createSaveCorrection(userId, 'https://blob.test/image', '{}', [course.id])
    const input = updateCourseSchema.parse({ content: { lesson: 'Nouvelle leçon' } })
    const updated = await resources.updateCourse(course.id, input)
    expect(updated.content).toMatchObject({ lesson: 'Nouvelle leçon', objectives: ['Objectif conservé'], exercise: 'Exercice' })
    expect(updated.id).toBe(course.id)
    await resources.retireCourse(course.id)
    expect(await resources.findCourses()).toEqual([])
    expect(await resources.findAllResources()).toEqual([])
    expect(await resources.resourceExists(course.id)).toBe(false)
    expect(await resources.canAccessRetiredCourse(course.id, userId)).toBe(true)
    expect(await resources.canAccessRetiredCourse(course.id, randomUUID())).toBe(false)
    expect((await resources.findCourseById(course.id)).content.lesson).toBe('Nouvelle leçon')
    expect(await corrections.findCorrectionById(correction.id, userId)).toBeDefined()
})

test('invalide les JWT existants lors du changement de mot de passe', async () => {
    await users.updateUser(userId, { password: 'nouveau-hash-fictif' })
    expect((await users.findUserById(userId)).token_version).toBe(1)
})

test('actualise l’activité et annule un avis d’inactivité après reprise', async () => {
    await db.query("UPDATE users SET last_active_at = NOW() - INTERVAL '25 months', inactive_notice_sent_at = NOW() WHERE id = $1", [userId])
    await users.recordActivity(userId)
    const { rows } = await db.query('SELECT last_active_at, inactive_notice_sent_at FROM users WHERE id = $1', [userId])
    expect(Date.now() - rows[0].last_active_at.getTime()).toBeLessThan(10000)
    expect(rows[0].inactive_notice_sent_at).toBeNull()
})

test('l’API protège un cours retiré et sert sa dernière version au propriétaire de la sauvegarde', async () => {
    const course = await resources.createCourse({ title: 'Cours privé historique', category: 'anatomie', order_index: 1, content: { lesson: 'Dernière version' } })
    await corrections.createSaveCorrection(userId, 'https://blob.test/image', '{}', [course.id])
    await resources.retireCourse(course.id)
    await request(app).get(`/api/v1/resources/courses/${course.id}`).expect(404)
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret')
    const oldSecret = process.env.JWT_SECRET
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
    try {
        const response = await request(app).get(`/api/v1/resources/courses/${course.id}`)
            .set('Authorization', `Bearer ${token}`).expect(200)
        expect(response.body.course.is_active).toBe(false)
        expect(response.body.course.content.lesson).toBe('Dernière version')
        expect(response.headers['cache-control']).toBe('private, no-store')
        const stranger = randomUUID()
        await db.query('INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)', [stranger, 'autre', 'autre@example.test', 'hash'])
        await request(app).get(`/api/v1/resources/courses/${course.id}`)
            .set('Authorization', `Bearer ${jwt.sign({ id: stranger }, process.env.JWT_SECRET)}`).expect(404)
    } finally {
        if (oldSecret === undefined) delete process.env.JWT_SECRET
        else process.env.JWT_SECRET = oldSecret
    }
})

test('rejouer une sauvegarde avec le même identifiant conserve une seule correction', async () => {
    const id = randomUUID()
    const first = await corrections.createSaveCorrection(userId, 'https://blob.test/initial', '{}', [], id)
    const replay = await corrections.createSaveCorrection(userId, 'https://blob.test/doublon', '{}', [], id)
    expect(replay.id).toBe(first.id)
    expect(replay.image_url).toBe('https://blob.test/initial')
    expect(await corrections.countCorrectionsByUser(userId)).toBe(1)
})
