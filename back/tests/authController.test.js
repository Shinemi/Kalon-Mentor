'use strict'

jest.mock('../models/userModel', () => ({
    recordActivity: jest.fn(),
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
}))
jest.mock('../models/correctionModel', () => ({ findCorrectionsByUser: jest.fn() }))
jest.mock('@vercel/blob', () => ({ del: jest.fn() }))

const request = require('supertest')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const app = require('../app')
const users = require('../models/userModel')
const corrections = require('../models/correctionModel')
const blob = require('@vercel/blob')

const user = {
    id: 1,
    username: 'artiste',
    email: 'artiste@example.com',
    token_version: 2
}
const password = 'dessin123!'
const credentials = {
    email: user.email,
    password
}
let token

beforeEach(() => {
    jest.resetAllMocks()
    process.env.JWT_SECRET = 'secret-exclusivement-pour-les-tests'
    token = jwt.sign({
        id: user.id,
        tokenVersion: 2
    }, process.env.JWT_SECRET)
    users.findUserById.mockResolvedValue(user)
})

test('inscription : hache le mot de passe et signe la version de session', async () => {
    users.findUserByEmail.mockResolvedValue(null)
    users.createUser.mockResolvedValue(user)

    const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
            ...credentials,
            username: user.username,
            acceptedTerms: true,
            declaredAdult: true,
            termsVersion: '1.1'
        })

    expect(response.status).toBe(201)
    expect(users.createUser).toHaveBeenCalledWith(user.username, user.email, expect.any(String), '1.1')

    const hash = users.createUser.mock.calls[0][2]

    expect(hash).not.toBe(password)
    expect(await bcrypt.compare(password, hash)).toBe(true)
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET)).toMatchObject({
        id: 1,
        tokenVersion: 2
    })
})

test('refuse une inscription sans acceptation des conditions', async () => {
    const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
            ...credentials,
            username: user.username
        })

    expect(response.status).toBe(422)
    expect(users.createUser).not.toHaveBeenCalled()
})

test('refuse un e-mail déjà utilisé sans créer de compte', async () => {
    users.findUserByEmail.mockResolvedValue(user)

    const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
            ...credentials,
            username: user.username,
            acceptedTerms: true,
            declaredAdult: true,
            termsVersion: '1.1'
        })

    expect(response.status).toBe(409)
    expect(users.createUser).not.toHaveBeenCalled()
})

test.each([true, false])('connexion avec mot de passe correct : %s', async correct => {
    users.findUserByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash(password, 4)
    })

    const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
            ...credentials,
            password: correct ? password : 'incorrect'
        })

    expect(response.status).toBe(correct ? 200 : 401)
    expect(response.body.user?.password).toBeUndefined()

    if (correct) expect(response.body.token).toEqual(expect.any(String))
})

test('récupère le profil authentifié', async () => {
    const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.user).toEqual(user)
})

test.each(['absent', 'invalide', 'révoqué', 'supprimé'])('refuse une session %s', async kind => {
    if (kind === 'révoqué') users.findUserById.mockResolvedValue({
        ...user,
        token_version: 3
    })
    if (kind === 'supprimé') users.findUserById.mockResolvedValue(null)

    const req = request(app)
        .get('/api/v1/auth/profile')
    if (kind !== 'absent') req.set('Authorization', `Bearer ${kind === 'invalide' ? 'invalide' : token}`)

    expect((await req).status).toBe(401)
})

test('modifie uniquement le profil de la session', async () => {
    users.updateUser.mockResolvedValue({
        ...user,
        username: 'nouveau'
    })

    const response = await request(app)
        .put('/api/v1/auth/profileUpdate')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'nouveau' })

    expect(response.status).toBe(200)
    expect(users.updateUser).toHaveBeenCalledWith(user.id, expect.objectContaining({ username: 'nouveau' }))
    expect(response.body.user.username).toBe('nouveau')
})

test('hache le nouveau mot de passe avant la mise à jour du profil', async () => {
    users.updateUser.mockResolvedValue(user)
    await request(app).put('/api/v1/auth/profileUpdate')
        .set('Authorization', `Bearer ${token}`).send({ password: 'Nouveau123!' }).expect(200)
    const [id, fields] = users.updateUser.mock.calls[0]
    expect(id).toBe(user.id)
    expect(fields.password).not.toBe('Nouveau123!')
    expect(await bcrypt.compare('Nouveau123!', fields.password)).toBe(true)
})

test.each([{ saved: [] }, { saved: [{ image_url: 'https://blob.test/dessin' }] }])('supprime son compte après ses images : %j', async ({ saved }) => {
    corrections.findCorrectionsByUser.mockResolvedValue(saved)
    const response = await request(app).delete('/api/v1/auth/profile').set('Authorization', `Bearer ${token}`).expect(204)
    expect(response.text).toBe('')
    expect(corrections.findCorrectionsByUser).toHaveBeenCalledWith(user.id)
    expect(users.deleteUser).toHaveBeenCalledWith(user.id)
    if (saved.length) {
        expect(blob.del).toHaveBeenCalledWith(['https://blob.test/dessin'], expect.any(Object))
        expect(blob.del.mock.invocationCallOrder[0]).toBeLessThan(users.deleteUser.mock.invocationCallOrder[0])
    } else expect(blob.del).not.toHaveBeenCalled()
})

test('conserve le compte si la suppression des images échoue', async () => {
    corrections.findCorrectionsByUser.mockResolvedValue([{ image_url: 'https://blob.test/dessin' }])
    blob.del.mockRejectedValue(new Error('secret Blob'))
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
        const response = await request(app).delete('/api/v1/auth/profile').set('Authorization', `Bearer ${token}`).expect(500)
        expect(users.deleteUser).not.toHaveBeenCalled()
        expect(JSON.stringify(response.body)).not.toContain('secret Blob')
    } finally {
        log.mockRestore()
    }
})

test('refuse un JWT expiré avant de consulter le compte', async () => {
    const expired = jwt.sign({ id: user.id, tokenVersion: 2 }, process.env.JWT_SECRET, { expiresIn: -1 })
    await request(app).get('/api/v1/auth/profile').set('Authorization', `Bearer ${expired}`).expect(401)
    expect(users.findUserById).not.toHaveBeenCalled()
})
