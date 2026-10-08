'use strict'

const { pool } = require('../db/db')

// content ->>'level' accède a la donnée de la clé level
exports.findAllResources = async () => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type, content->>'level' AS level 
         FROM resources`
    )

    return rows
}

// Les cours sont triés par catégorie puis par ordre pédagogique.
exports.findCourses = async (category) => {
    const values = []
    let query = `
        SELECT id, title, category, type, order_index, content, author_name
        FROM resources
        WHERE type = 'course'
    `

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
        `SELECT id, title, category, type, order_index, content, author_name
         FROM resources
         WHERE id = $1 AND type = 'course'`,
        [id]
    )

    return rows[0]
}

// Vérifie qu'un ID recommandé par l'IA correspond bien à une vraie ressource en base,
exports.resourceExists = async (id) => {
    const { rows } = await pool.query(
        `SELECT id FROM resources WHERE id = $1`,
        [id]
    )

    return rows.length > 0
}