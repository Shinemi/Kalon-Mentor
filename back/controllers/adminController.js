'use strict'

const userModel = require('../models/userModel')
const analysisModel = require('../models/analysisModel')
const resourceModel = require('../models/resourceModel')
const { z } = require('zod')

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

exports.getUserAnalyses = async (req, res) => {
    res.set('Cache-Control', 'private, no-store')

    const { id } = req.params

    if (!z.uuid().safeParse(id).success) {
        return res.status(422).json({
            title: 'Identifiant utilisateur invalide.',
            statut: 422,
            invalidParams: [{ path: 'id', message: 'Un identifiant UUID valide est attendu.' }]
        })
    }

    try {
        const user = await userModel.findUserById(id)

        if (!user) {
            return res.status(404).json({
                title: 'Utilisateur introuvable.',
                statut: 404,
                invalidParams: []
            })
        }

        const events = await analysisModel.findAnalysisEventsByUser(id)

        res.json({
            total: events.length,
            dates: events.map(event => event.created_at.toISOString())
        })
    } catch (error) {
        console.error('Chargement des analyses impossible :', error.code || error.name)

        res.status(500).json({
            title: 'Impossible de charger les analyses de cet utilisateur.',
            statut: 500,
            invalidParams: []
        })
    }
}

exports.createCourse = async (req, res) => {
    try {
        const course = await resourceModel.createCourse(req.body)
        res.status(201).json({ course })
    } catch (error) {
        if (error.code === '23505' && error.constraint === 'resources_category_order_unique') {
            return res.status(409).json({
                title: 'Ordre indisponible.',
                statut: 409,
                invalidParams: [{ path: 'order_index', message: 'Cet ordre est déjà utilisé dans cette catégorie.' }]
            })
        }

        console.error('Création du cours impossible :', error.code || error.name)

        res.status(500).json({
            title: 'Impossible de créer le cours.',
            statut: 500,
            invalidParams: []
        })
    }
}