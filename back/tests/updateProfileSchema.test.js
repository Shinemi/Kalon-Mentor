'use strict'

const { updateProfileSchema } = require('../schemas/authSchemas')
const validate = require('../middlewares/validateMiddleware')

test.each([
    [{ username: ' artiste ' }, { username: 'artiste' }],
    [{ email: 'ARTISTE@example.com' }, { email: 'artiste@example.com' }],
    [{ password: 'dessin123!' }, { password: 'dessin123!' }],
])('accepte un champ seul et applique sa normalisation', (body, expected) => {
    expect(updateProfileSchema.parse(body)).toEqual(expected)
})

test.each([
    {}, { username: undefined }, { username: ' ' }, { username: 'a' },
    { username: 'a'.repeat(51) }, { email: 'invalide' }, { email: null },
    { password: '' }, { password: 'court1!' }, { password: 'dessinabc!' },
    { password: 'dessin123' }, { password: 'dessin123 ' },
    { username: 'artiste', role: 'admin' },
])('refuse les données invalides : %j', body => {
    expect(updateProfileSchema.safeParse(body).success).toBe(false)
})

test('le middleware bloque les données invalides avec une réponse 422', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    validate(updateProfileSchema)({ body: {} }, res, next)
    expect(res.status).toHaveBeenCalledWith(422)
    expect(next).not.toHaveBeenCalled()
})

test('le middleware transmet les données validées', () => {
    const req = { body: { username: ' artiste ' } }
    const next = jest.fn()
    validate(updateProfileSchema)(req, {}, next)
    expect(req.body).toEqual({ username: 'artiste' })
    expect(next).toHaveBeenCalledTimes(1)
})
