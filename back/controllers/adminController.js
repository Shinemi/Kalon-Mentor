'use strict'

const userModel = require('../models/userModel')

exports.getUsers = async (req, res) => {
    res.set('Cache-Control', 'private, no-store')

    try {
        const users = await userModel.findUsers()
        res.json({ users })
    } catch (error) {
        console.error('Chargement des utilisateurs impossible :', error.code || error.name)

        res.status(500).json({
            title: 'Impossible de charger les utilisateurs.',
            statut: 500,
            invalidParams: []
        })
    }
}

exports.getAiStatus = (req, res) => {
    res.set('Cache-Control', 'private, no-store')

    res.json({
        quotaAvailable: false,
        quota: null,
        message: 'Information indisponible'
    })
}