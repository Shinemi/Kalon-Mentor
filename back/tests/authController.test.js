'use strict'

jest.mock('../models/userModel', () => ({
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn()
}))
jest.mock('../models/correctionModel', () => ({}))

const request = require('supertest')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const app = require('../app')
const users = require('../models/userModel')

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
