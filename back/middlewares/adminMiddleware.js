'use strict'

function adminMiddleware(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            title: 'Accès réservé aux administrateurs.',
            statut: 403,
            invalidParams: []
        })
    }

    next()
}

module.exports = adminMiddleware