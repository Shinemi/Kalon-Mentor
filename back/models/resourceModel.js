const { pool } = require('../db/db')

// Utilisé pour construire le prompt de l'IA : la liste fermée dans
// laquelle elle doit choisir ses recommandations.
exports.findAllResources = async () => {
    const { rows } = await pool.query(
        `SELECT id, title, category, type FROM resources`
    )

    return rows
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