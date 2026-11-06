'use strict'

const { forgotPasswordSchema, resetPasswordSchema, registerSchema } = require('../schemas/authSchemas')

test('normalise l’adresse de récupération', () => {
    expect(forgotPasswordSchema.parse({ email: ' ARTISTE@example.com ' })).toEqual({ email: 'artiste@example.com' })
})

test.each([undefined, '', 'a'.repeat(63), 'g'.repeat(64), 'A'.repeat(64)])('refuse un token invalide : %j', token => {
    expect(resetPasswordSchema.safeParse({
        token,
        password: 'dessin123!'
    }).success).toBe(false)
})

test('accepte un token hexadécimal de 32 octets', () => {
    expect(resetPasswordSchema.safeParse({
        token: 'ab'.repeat(32),
        password: 'dessin123!'
    }).success).toBe(true)
})

test.each(['court1!', 'sansChiffre!', 'sansSpecial123'])('refuse un nouveau mot de passe faible : %s', password => {
    expect(resetPasswordSchema.safeParse({
        token: 'ab'.repeat(32),
        password
    }).success).toBe(false)
})

test.each([undefined, false, 'true'])('exige un consentement explicite aux conditions : %j', acceptedTerms => {
    expect(registerSchema.safeParse({
        username: 'artiste',
        email: 'artiste@example.com',
        password: 'dessin123!',
        acceptedTerms
    }).success).toBe(false)
})
