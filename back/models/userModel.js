'use strict'

const { pool } = require('../db/db')

exports.createUser = async (username, email, hashedPassword) => {
    const { rows } = await pool.query(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at, token_version`,
        [username, email.toLowerCase().trim(), hashedPassword]
    )

    return rows[0]
}

exports.findUserByEmail = async (email) => {
    const { rows } = await pool.query(
        `SELECT id, username, email, password, token_version
         FROM users
         WHERE email = $1`,
        [email.toLowerCase().trim()]
    )

    return rows[0]
}

exports.findUserById = async (id) => {
    const { rows } = await pool.query(
        `SELECT id, username, email, avatar_url, created_at, token_version
         FROM users
         WHERE id = $1`,
        [id]
    )

    return rows[0]
}

exports.savePasswordResetToken = async (userId, tokenHash) => {
    const { rowCount } = await pool.query(
        `UPDATE users
         SET password_reset_token_hash = $2,
             password_reset_expires_at = NOW() + INTERVAL '30 minutes'
         WHERE id = $1
           AND (password_reset_expires_at IS NULL
                OR password_reset_expires_at < NOW() + INTERVAL '29 minutes')`,
        [userId, tokenHash]
    )

    return rowCount > 0
}

exports.clearPasswordResetToken = async (userId, tokenHash) => {
    await pool.query(
        `UPDATE users
         SET password_reset_token_hash = NULL, password_reset_expires_at = NULL
         WHERE id = $1 AND password_reset_token_hash = $2`,
        [userId, tokenHash]
    )
}

exports.resetPassword = async (tokenHash, hashedPassword) => {
    const { rows } = await pool.query(
        `UPDATE users
         SET password = $2,
             password_reset_token_hash = NULL,
             password_reset_expires_at = NULL,
             token_version = token_version + 1
         WHERE password_reset_token_hash = $1
           AND password_reset_expires_at > NOW()
         RETURNING id`,
        [tokenHash, hashedPassword]
    )

    return rows[0]
}

// Met à jour uniquement les champs fournis (tous optionnels).
// fields est un objet du type { username, email, password }
exports.updateUser = async (id, fields) => {
    const columns = []
    const values = []

    if (fields.username) {
        values.push(fields.username)
        columns.push(`username = $${values.length}`)
    }

    if (fields.email) {
        values.push(fields.email.toLowerCase().trim())
        columns.push(`email = $${values.length}`)
    }

    if (fields.password) {
        values.push(fields.password)
        columns.push(`password = $${values.length}`)
    }

    if (fields.email || fields.password) {
        columns.push('password_reset_token_hash = NULL', 'password_reset_expires_at = NULL')
    }

    values.push(id)

    const { rows } = await pool.query(
        `UPDATE users
         SET ${columns.join(', ')}
         WHERE id = $${values.length}
         RETURNING id, username, email`,
        values
    )

    return rows[0]
}

exports.deleteUser = async (userId) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        await client.query(
            `DELETE FROM corrections_resources
             WHERE correction_id IN (
                 SELECT id FROM corrections WHERE user_id = $1
             )`,
            [userId]
        )

        await client.query(
            'DELETE FROM corrections WHERE user_id = $1',
            [userId]
        )

        await client.query(
            'DELETE FROM users WHERE id = $1',
            [userId]
        )

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}
