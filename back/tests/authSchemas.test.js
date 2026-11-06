'use strict'

const { registerSchema, loginSchema } = require('../schemas/authSchemas')

const credentials = {
    username: 'artiste',
    email: 'artiste@example.com',
    password: 'motdepasse123!',
    acceptedTerms: true,
    declaredAdult: true,
    termsVersion: '1.1',
}

test('normalise le pseudo et l’e-mail du formulaire', () => {
    expect(registerSchema.parse({
        ...credentials,
        username: ' artiste ',
        email: ' ARTISTE@example.com ',
    })).toEqual(credentials)
})

test.each([' ', 'a', 'a'.repeat(51)])('refuse un pseudo invalide : %j', username => {
    expect(registerSchema.safeParse({
        ...credentials,
        username
    }).success).toBe(false)
})

test.each(['abc12!', 'motdepasse!', 'motdepasse123', 'motdepasse123 '])(
    'refuse un mot de passe sans la complexité requise : %j', password => {
        expect(registerSchema.safeParse({
            ...credentials,
            password
        }).success).toBe(false)
    }
)

test.each([registerSchema, loginSchema])('refuse les e-mails invalides et champs supplémentaires', schema => {
    const body = schema === registerSchema
        ? credentials
        : {
            email: credentials.email,
            password: credentials.password
        }

    expect(schema.safeParse({
        ...body,
        email: 'invalide'
    }).success).toBe(false)
    expect(schema.safeParse({
        ...body,
        role: 'admin'
    }).success).toBe(false)
    expect(schema.safeParse({
        ...body,
        password: undefined
    }).success).toBe(false)
})

test('la connexion conserve le mot de passe et ne vérifie pas sa complexité', () => {
    expect(loginSchema.parse({
        email: ' ARTISTE@example.com ',
        password: ' ancien '
    }))
        .toEqual({
            email: credentials.email,
            password: ' ancien '
        })
    expect(loginSchema.safeParse({
        email: credentials.email,
        password: ''
    }).success).toBe(false)
})

test.each(['acceptedTerms', 'declaredAdult'])(
    '%s exige le booléen true',
    field => {
        for (const value of [undefined, false, 'true', 1, null]) {
            const result = registerSchema.safeParse({
                ...credentials,
                [field]: value
            })

            expect(result.success).toBe(false)
        }
    }
)

test.each([undefined, '1.0', '2.0', null])(
    'refuse une version des CGU invalide : %j',
    termsVersion => {
        expect(registerSchema.safeParse({
            ...credentials,
            termsVersion
        }).success).toBe(false)
    }
)

test.each(['terms_accepted_at', 'adult_declared_at'])(
    'refuse une date fournie par le navigateur : %s',
    field => {
        expect(registerSchema.safeParse({
            ...credentials,
            [field]: '2020-01-01'
        }).success).toBe(false)
    }
)
