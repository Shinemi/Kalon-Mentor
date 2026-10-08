'use strict'

const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ title: 'Authentication required', statut: 401, invalidParams: [] })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findUserById(decoded.id)

        if (!user) {
            return res.status(401).json({ title: 'User not found', statut: 401, invalidParams: [] })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({ title: 'Invalid or expired token', statut: 401, invalidParams: [] })
    }
}

module.exports = authMiddleware