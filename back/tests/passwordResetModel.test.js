'use strict'

jest.mock('../db/db', () => ({ pool: { query: jest.fn() } }))

const { pool } = require('../db/db')
const users = require('../models/userModel')

beforeEach(() => jest.resetAllMocks())

test('enregistre le hash et une expiration limitée du lien', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 })

    await expect(users.savePasswordResetToken(7, 'hash')).resolves.toBe(true)
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '30 minutes'"), [7, 'hash'])
})

test('signale le délai entre deux demandes', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 })

    await expect(users.savePasswordResetToken(7, 'hash')).resolves.toBe(false)
})

test('efface seulement le lien correspondant au hash', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 })
    await users.clearPasswordResetToken(7, 'hash')

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1 AND password_reset_token_hash = $2'), [7, 'hash'])
})

test('change le mot de passe avec expiration et révocation des anciennes sessions', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 7 }] })

    await expect(users.resetPassword('hash', 'mot-de-passe-haché')).resolves.toEqual({ id: 7 })

    const [sql, values] = pool.query.mock.calls[0]

    expect(sql).toContain('password_reset_expires_at > NOW()')
    expect(sql).toContain('token_version = token_version + 1')
    expect(sql).toContain('password_reset_token_hash = NULL')
    expect(values).toEqual(['hash', 'mot-de-passe-haché'])
})

test('un lien expiré ou consommé ne modifie aucun compte', async () => {
    pool.query.mockResolvedValue({ rows: [] })

    await expect(users.resetPassword('hash', 'haché')).resolves.toBeUndefined()
})
