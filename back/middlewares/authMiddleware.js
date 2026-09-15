const jwt = require('jsonwebtoken')
const db = require('../db/db')

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const result = await db.query('SELECT id, username, email FROM users WHERE id = $1', [decoded.id])
        const user = result.rows[0]

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

module.exports = authMiddleware