'use strict'

const { pool } = require('../db/db')

exports.createAnalysisEvent = async (requestId, userId) => {
    await pool.query(
        `INSERT INTO analysis_events (id, user_id)
         VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [requestId, userId]
    )
}

// Le verrou est partagé en PostgreSQL, y compris entre onglets et instances Node.
exports.reserveAnalysis = async (requestId, userId) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const user = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId])
        if (!user.rows.length) throw new Error('Compte introuvable')
        const quota = await client.query(
            `SELECT
                COUNT(*) FILTER (WHERE created_at >= (date_trunc('day', NOW() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'))::int AS daily,
                COUNT(*)::int AS monthly
             FROM analysis_events WHERE user_id = $1
             AND created_at >= (date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris')`, [userId]
        )
        const counts = quota.rows[0]
        if (counts.daily >= 2 || counts.monthly >= 10) {
            await client.query('COMMIT')
            return { allowed: false, reason: counts.monthly >= 10 ? 'monthly' : 'daily' }
        }
        const lock = await client.query(
            `INSERT INTO analysis_locks (user_id, request_id) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET request_id = EXCLUDED.request_id,
                 started_at = NOW(), expires_at = NOW() + INTERVAL '120 seconds'
             WHERE analysis_locks.expires_at <= NOW() RETURNING request_id`, [userId, requestId]
        )
        await client.query('COMMIT')
        return { allowed: lock.rows.length > 0, reason: lock.rows.length ? null : 'busy' }
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

exports.finishAnalysis = async (requestId, userId, signal) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId])
        signal?.throwIfAborted()
        const lock = await client.query(
            `DELETE FROM analysis_locks WHERE user_id = $1 AND request_id = $2
             AND expires_at > clock_timestamp() RETURNING request_id`, [userId, requestId]
        )
        if (!lock.rows.length) {
            await client.query('ROLLBACK')
            return false
        }
        await client.query(
            `INSERT INTO analysis_events (id, user_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
            [requestId, userId]
        )
        signal?.throwIfAborted()
        await client.query('COMMIT')
        return true
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

exports.releaseAnalysis = async (requestId, userId) => {
    await pool.query('DELETE FROM analysis_locks WHERE user_id = $1 AND request_id = $2', [userId, requestId])
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
