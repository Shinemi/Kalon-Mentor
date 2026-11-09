'use strict'

const { pool } = require('../db/db')

exports.createAnalysisEvent = async (requestId, userId) => {
    await pool.query(
        `INSERT INTO analysis_events (id, user_id)
         VALUES ($1, $2)`,
        [requestId, userId]
    )
}

exports.findAnalysisEventsByUser = async (userId) => {
    const { rows } = await pool.query(
        `SELECT created_at
         FROM analysis_events
         WHERE user_id = $1
         ORDER BY created_at DESC, id DESC`,
        [userId]
    )

    return rows
}