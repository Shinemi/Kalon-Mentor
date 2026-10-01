const { pool } = require('../db/db')

// resourceIds : tableau de 0 à 3 UUID (ou moins), selon ce que l'IA a
// recommandé. On les répartit sur les 3 colonnes, les absents restant null.
exports.createCorrection = async (userId, imageUrl, feedbackText, resourceIds = []) => {
    const [resourceId1, resourceId2, resourceId3] = resourceIds

    const { rows } = await pool.query(
        `INSERT INTO corrections (user_id, image_url, feedback_text, resource_id_1, resource_id_2, resource_id_3)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, image_url, feedback_text, resource_id_1, resource_id_2, resource_id_3, created_at`,
        [userId, imageUrl, feedbackText, resourceId1 ?? null, resourceId2 ?? null, resourceId3 ?? null]
    )

    return rows[0]
}

exports.findCorrectionsByUser = async (userId) => {
    const { rows } = await pool.query(
        `SELECT id, image_url, feedback_text, resource_id_1, resource_id_2, resource_id_3, created_at
         FROM corrections
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    )

    return rows
}

exports.countCorrectionsByUser = async (userId) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*) FROM corrections WHERE user_id = $1`,
        [userId]
    )

    return Number(rows[0].count)
}

// Le user_id dans le WHERE empêche de supprimer la correction d'un autre membre
exports.deleteCorrection = async (id, userId) => {
    const { rows } = await pool.query(
        `DELETE FROM corrections
         WHERE id = $1 AND user_id = $2
         RETURNING image_url`,
        [id, userId]
    )

    return rows[0]
}