const jwt = require('jsonwebtoken')
const db = require('../config/db')

const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = async (req, res, next) => {
    try {
        let token

        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({
                message: 'Not authorized, token missing'
            })
        }

        // Vérifier le token
        const decoded = jwt.verify(token, JWT_SECRET)

        // Récupérer l'utilisateur depuis PostgreSQL
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [decoded.id]
        )

        const user = result.rows[0]

        if (!user) {
            return res.status(401).json({
                message: 'User no longer exists'
            })
        }

        // Ajouter l'utilisateur à la requête
        req.user = user

        next()

    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized, invalid token',
            error: error.message
        })
    }
}

module.exports = authMiddleware