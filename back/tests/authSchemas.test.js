'use strict'

const { registerSchema, loginSchema } = require('../schemas/authSchemas')

const credentials = {
    username: 'artiste',
    email: 'artiste@example.com',
    password: 'motdepasse123!',
}

test('normalise le pseudo et l’e-mail du formulaire', () => {
    expect(registerSchema.parse({
        ...credentials,
        username: ' artiste ',
        email: ' ARTISTE@example.com ',
    })).toEqual(credentials)
})

test.each([' ', 'a', 'a'.repeat(51)])('refuse un pseudo invalide : %j', username => {
    expect(registerSchema.safeParse({ ...credentials, username }).success).toBe(false)
})

test.each(['abc12!', 'motdepasse!', 'motdepasse123', 'motdepasse123 '])(
    'refuse un mot de passe sans la complexité requise : %j', password => {
        expect(registerSchema.safeParse({ ...credentials, password }).success).toBe(false)
    }
)

test.each([registerSchema, loginSchema])('refuse les e-mails invalides et champs supplémentaires', schema => {
    const body = schema === registerSchema
        ? credentials
        : { email: credentials.email, password: credentials.password }

    expect(schema.safeParse({ ...body, email: 'invalide' }).success).toBe(false)
    expect(schema.safeParse({ ...body, role: 'admin' }).success).toBe(false)
    expect(schema.safeParse({ ...body, password: undefined }).success).toBe(false)
})

test('la connexion conserve le mot de passe et ne vérifie pas sa complexité', () => {
    expect(loginSchema.parse({ email: ' ARTISTE@example.com ', password: ' ancien ' }))
        .toEqual({ email: credentials.email, password: ' ancien ' })
    expect(loginSchema.safeParse({ email: credentials.email, password: '' }).success).toBe(false)
})
