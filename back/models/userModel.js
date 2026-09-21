const { pool } = require('../db/db')

exports.createUser = async (username, email, hashedPassword) => {
    const { rows } = await pool.query(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at`,
        [username, email.toLowerCase().trim(), hashedPassword]
    )

    return rows[0]
}

exports.findUserByEmail = async (email) => {
    const { rows } = await pool.query(
        `SELECT id, username, email, password
         FROM users
         WHERE email = $1`,
        [email.toLowerCase().trim()]
    )

    return rows[0]
}

exports.findUserById = async (id) => {
    const { rows } = await pool.query(
        `SELECT id, username, email, avatar_url, created_at
         FROM users
         WHERE id = $1`,
        [id]
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