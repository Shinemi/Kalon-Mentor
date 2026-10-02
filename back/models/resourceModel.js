const { pool } = require('../db/db')

// Utilisé pour construire le prompt de l'IA : la liste fermée dans
// laquelle elle doit choisir ses recommandations.
exports.findAllResources = async () => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type, content->>'level' AS level
         FROM resources`
    )

    return rows
}

// Récupère uniquement les ressources de type "course".
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
        query += ` AND category = $1`
    }

    query += ` ORDER BY category, order_index`

    const { rows } = await pool.query(query, values)

    return rows
}

// Récupère un cours précis à partir de son ID.
exports.findCourseById = async (id) => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type, order_index, content, author_name
         FROM resources
         WHERE id = $1 AND type = 'course'`,
        [id]
    )

    return rows[0]
}

// Vérifie qu'un ID recommandé par l'IA correspond bien à une vraie
// ressource en base, avant de le stocker (défense contre une éventuelle
// hallucination, malgré la consigne donnée dans le prompt).
exports.resourceExists = async (id) => {
    const { rows } = await pool.query(
        `SELECT id FROM resources WHERE id = $1`,
        [id]
    )

    return rows.length > 0
}