'use strict'

jest.mock('../models/userModel', () => ({
    findUserByEmail: jest.fn(), findUserById: jest.fn(),
    savePasswordResetToken: jest.fn(), clearPasswordResetToken: jest.fn(), resetPassword: jest.fn()
}))
jest.mock('../models/correctionModel', () => ({}))
jest.mock('../services/emailService', () => ({ sendPasswordResetEmail: jest.fn() }))
jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn().mockResolvedValue() }))

const express = require('express')
const request = require('supertest')
const crypto = require('node:crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const { sendPasswordResetEmail } = require('../services/emailService')
const { forgotPassword, resetPassword } = require('../controllers/authController')
const validate = require('../middlewares/validateMiddleware')
const { forgotPasswordSchema, resetPasswordSchema } = require('../schemas/authSchemas')

const app = express()
app.use(express.json())
app.post('/forgot', validate(forgotPasswordSchema), forgotPassword)
app.post('/reset', validate(resetPasswordSchema), resetPassword)
app.get('/private', require('../middlewares/authMiddleware'), (req, res) => res.json({ ok: true }))

const token = 'a'.repeat(64)
const password = 'NouveauMotDePasse1!'
const user = { id: 'owner', email: 'artiste@example.com', token_version: 0 }

beforeEach(() => {
    jest.clearAllMocks()
    userModel.findUserByEmail.mockResolvedValue(user)
    userModel.savePasswordResetToken.mockResolvedValue(true)
    sendPasswordResetEmail.mockResolvedValue(undefined)
    userModel.resetPassword.mockResolvedValue({ id: 'owner' })
    process.env.JWT_SECRET = 'reset-test-secret'
})

test('n’enregistre que l’empreinte et ne renvoie pas le jeton au client', async () => {
    const response = await request(app).post('/forgot').send({ email: ' ARTISTE@example.com ' })
    expect(response.status).toBe(202)
    expect(userModel.findUserByEmail).toHaveBeenCalledWith(user.email)
    const rawToken = sendPasswordResetEmail.mock.calls[0][1]
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/)
    expect(userModel.savePasswordResetToken).toHaveBeenCalledWith('owner', crypto.createHash('sha256').update(rawToken).digest('hex'))
    expect(JSON.stringify(response.body)).not.toContain(rawToken)
})

test('donne la même réponse pour une adresse inconnue', async () => {
    const known = await request(app).post('/forgot').send({ email: user.email })
    userModel.findUserByEmail.mockResolvedValue(null)
    sendPasswordResetEmail.mockClear()
    const unknown = await request(app).post('/forgot').send({ email: 'inconnu@example.com' })
    expect(unknown.status).toBe(known.status)
    expect(unknown.body).toEqual(known.body)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
})

test('le délai par compte empêche un second envoi trop rapproché', async () => {
    userModel.savePasswordResetToken.mockResolvedValue(false)
    const response = await request(app).post('/forgot').send({ email: user.email })
    expect(response.status).toBe(202)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
})

test('annule le jeton correspondant si Brevo échoue, sans révéler le compte', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce(new Error('Erreur Brevo'))
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
        const response = await request(app).post('/forgot').send({ email: user.email })
        expect(response.status).toBe(202)
        expect(userModel.clearPasswordResetToken).toHaveBeenCalledWith('owner', userModel.savePasswordResetToken.mock.calls[0][1])
    } finally {
        log.mockRestore()
    }
})

test('hache le mot de passe et fournit l’empreinte au modèle', async () => {
    const response = await request(app).post('/reset').send({ token, password })
    expect(response.status).toBe(200)
    const [tokenHash, hashedPassword] = userModel.resetPassword.mock.calls[0]
    expect(tokenHash).toBe(crypto.createHash('sha256').update(token).digest('hex'))
    expect(await bcrypt.compare(password, hashedPassword)).toBe(true)
    expect(response.body.token).toBeUndefined()
})

test('refuse un jeton expiré, inconnu ou déjà utilisé', async () => {
    userModel.resetPassword.mockResolvedValue(undefined)
    const response = await request(app).post('/reset').send({ token, password })
    expect(response.status).toBe(400)
    expect(response.body.invalidParams[0].path).toBe('token')
})

test.each([
    { token: 'invalide', password },
    { token, password: 'court' },
    { token, password, userId: 'autre' }
])('Zod refuse les données incorrectes : %j', async (body) => {
    const response = await request(app).post('/reset').send(body)
    expect(response.status).toBe(422)
    expect(userModel.resetPassword).not.toHaveBeenCalled()
})

test('refuse une adresse invalide avant la recherche de compte', async () => {
    const response = await request(app).post('/forgot').send({ email: 'invalide' })
    expect(response.status).toBe(422)
    expect(userModel.findUserByEmail).not.toHaveBeenCalled()
})

test('rejette une ancienne session après l’incrément de version et accepte la nouvelle', async () => {
    userModel.findUserById.mockResolvedValue({ ...user, token_version: 1 })
    const oldToken = jwt.sign({ id: 'owner', tokenVersion: 0 }, process.env.JWT_SECRET)
    const newToken = jwt.sign({ id: 'owner', tokenVersion: 1 }, process.env.JWT_SECRET)
    const oldResponse = await request(app).get('/private').set('Authorization', `Bearer ${oldToken}`)
    const newResponse = await request(app).get('/private').set('Authorization', `Bearer ${newToken}`)
    expect(oldResponse.status).toBe(401)
    expect(newResponse.status).toBe(200)
})

test('accepte une ancienne session sans version tant que le compte est à la version zéro', async () => {
    userModel.findUserById.mockResolvedValue(user)
    const legacyToken = jwt.sign({ id: 'owner' }, process.env.JWT_SECRET)
    const response = await request(app).get('/private').set('Authorization', `Bearer ${legacyToken}`)
    expect(response.status).toBe(200)
})

test('limite les demandes répétées sur les vraies routes de récupération', async () => {
    userModel.findUserByEmail.mockResolvedValue(null)
    const limitedApp = express()
    limitedApp.use(express.json())
    limitedApp.use('/auth', require('../routes/authRoutes'))
    for (let attempt = 0; attempt < 5; attempt++) {
        const response = await request(limitedApp).post('/auth/forgotPassword').send({ email: 'inconnu@example.com' })
        expect(response.status).toBe(202)
    }
    const response = await request(limitedApp).post('/auth/forgotPassword').send({ email: 'inconnu@example.com' })
    expect(response.status).toBe(429)
    expect(response.body.statut).toBe(429)
})
