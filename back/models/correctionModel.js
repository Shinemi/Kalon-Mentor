const { pool } = require('../db/db')

// resourceIds : tableau de 0 à 3 UUID (ordre = priorité : le premier
// élément est la ressource la plus importante).
// On utilise une transaction (BEGIN/COMMIT) parce que deux tables sont
// écrites (corrections, puis corrections_resources) : si l'une des
// insertions échoue, on annule tout plutôt que de laisser une correction
// à moitié liée à ses ressources.
exports.createCorrection = async (userId, imageUrl, feedbackText, resourceIds = []) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const { rows } = await client.query(
            `INSERT INTO corrections (user_id, image_url, feedback_text)
             VALUES ($1, $2, $3)
             RETURNING id, image_url, feedback_text, created_at`,
            [userId, imageUrl, feedbackText]
        )
        const correction = rows[0]

        for (let i = 0; i < resourceIds.length; i++) {
            await client.query(
                `INSERT INTO corrections_resources (correction_id, resource_id, priority)
                 VALUES ($1, $2, $3)`,
                [correction.id, resourceIds[i], i + 1]
            )
        }

        await client.query('COMMIT')
        return correction
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

exports.findCorrectionsByUser = async (userId) => {
    const { rows: corrections } = await pool.query(
        `SELECT id, image_url, feedback_text, created_at
         FROM corrections
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    )

    if (corrections.length === 0) {
        return []
    }

    // Une seule requête pour récupérer toutes les ressources liées à
    // toutes ces corrections, puis on les regroupe en JS (plus simple
    // à lire qu'un GROUP BY + json_agg côté SQL).
    const correctionIds = corrections.map((correction) => correction.id)
    const { rows: resourceLinks } = await pool.query(
        `SELECT correction_id, resource_id, priority
         FROM corrections_resources
         WHERE correction_id = ANY($1)
         ORDER BY priority`,
        [correctionIds]
    )

    return corrections.map((correction) => ({
        ...correction,
        resources: resourceLinks
            .filter((link) => link.correction_id === correction.id)
            .map((link) => ({ resourceId: link.resource_id, priority: link.priority })),
    }))
}

exports.countCorrectionsByUser = async (userId) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*) FROM corrections WHERE user_id = $1`,
        [userId]
    )

    return Number(rows[0].count)
}

// Le user_id dans le WHERE empêche de supprimer la correction d'un autre
// membre. ON DELETE CASCADE sur corrections_resources (défini en SQL)
// supprime automatiquement les liaisons vers ses ressources.
exports.deleteCorrection = async (id, userId) => {
    const { rows } = await pool.query(
        `DELETE FROM corrections
         WHERE id = $1 AND user_id = $2
         RETURNING image_url`,
        [id, userId]
    )

    return rows[0]
}