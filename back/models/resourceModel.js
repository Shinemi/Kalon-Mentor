'use strict'

const { pool } = require('../db/db')

// content ->>'level' accède a la donnée de la clé level
exports.findAllResources = async () => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type, content->>'level' AS level 
         FROM resources WHERE type = 'course' AND is_active = true`
    )

    return rows
}

// Les cours sont triés par catégorie puis par ordre pédagogique.
exports.findCourses = async (category, includeInactive = false) => {
    const values = []
    let query = `
        SELECT id, title, category, type, order_index, content, author_name, is_active
        FROM resources
        WHERE type = 'course'
    `

    if (!includeInactive) query += ' AND is_active = true'

    if (category) {
        values.push(category)
        // category::text évite que Postgres essaie de caster la valeur
        // reçue vers l'enum ressource_category : une catégorie inconnue
        // (ex: faute de frappe côté front) renvoie 0 résultat plutôt que
        // de faire planter la requête avec une erreur de cast.
        query += ` AND category::text = $1`
    }

    query += ` ORDER BY category, order_index`

    const { rows } = await pool.query(query, values)

    return rows
}

exports.findCourseById = async (id) => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type, order_index, content, author_name, is_active
         FROM resources
         WHERE id = $1 AND type = 'course'`,
        [id]
    )

    return rows[0]
}

// Vérifie qu'un ID recommandé par l'IA correspond bien à une vraie ressource en base,
exports.resourceExists = async (id) => {
    const { rows } = await pool.query(
        `SELECT id FROM resources WHERE id = $1 AND type = 'course' AND is_active = true`,
        [id]
    )

    return rows.length > 0
}

exports.canAccessRetiredCourse = async (resourceId, userId) => {
    const { rows } = await pool.query(
        `SELECT 1 FROM corrections_resources cr
         JOIN corrections c ON c.id = cr.correction_id
         WHERE cr.resource_id = $1 AND c.user_id = $2 LIMIT 1`,
        [resourceId, userId]
    )
    return rows.length > 0
}

exports.updateCourse = async (id, fields) => {
    const columns = []
    const values = []
    for (const key of ['title', 'category', 'order_index', 'author_name', 'content']) {
        if (fields[key] === undefined) continue
        values.push(key === 'content' ? JSON.stringify(fields[key]) : fields[key])
        columns.push(key === 'content'
            ? `content = COALESCE(content, '{}'::jsonb) || $${values.length}::jsonb`
            : `${key} = $${values.length}`)
    }
    values.push(id)
    const { rows } = await pool.query(
        `UPDATE resources SET ${columns.join(', ')} WHERE id = $${values.length} AND type = 'course'
         RETURNING id, title, category, type, order_index, content, author_name, is_active`, values
    )
    return rows[0]
}

exports.retireCourse = async id => {
    const { rows } = await pool.query(
        `UPDATE resources SET is_active = false WHERE id = $1 AND type = 'course' RETURNING id`, [id]
    )
    return rows[0]
}

exports.createCourse = async (course) => {
    const { rows } = await pool.query(
        `INSERT INTO resources (title, category, type, order_index, content, author_name)
         VALUES ($1, $2, 'course', $3, $4, $5)
         RETURNING id, title, category, type, order_index, content, author_name, is_active`,
        [
            course.title,
            course.category,
            course.order_index,
            JSON.stringify(course.content),
            course.author_name ?? null
        ]
    )

    return rows[0]
}
