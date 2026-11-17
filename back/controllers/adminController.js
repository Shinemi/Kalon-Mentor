'use strict'

const userModel = require('../models/userModel')
const analysisModel = require('../models/analysisModel')
const resourceModel = require('../models/resourceModel')
const { z } = require('zod')

exports.getUsers = async (req, res) => {
    res.set('Cache-Control', 'private, no-store')

    try {
        const page = Number(req.query.page ?? 1)
        const pageSize = Number(req.query.pageSize ?? 20)
        if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 ||
            !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
            return res.status(422).json({ title: 'Pagination invalide.', statut: 422, invalidParams: [] })
        }
        const users = await userModel.findUsers(pageSize + 1, (page - 1) * pageSize)
        res.json({ users: users.slice(0, pageSize), page, pageSize, hasNext: users.length > pageSize })
    } catch (error) {
        console.error('Chargement des utilisateurs impossible :', error.code || error.name)

        res.status(500).json({
            title: 'Impossible de charger les utilisateurs.',
            statut: 500,
            invalidParams: []
        })
    }
}

exports.getCourses = async (req, res) => {
    try {
        res.set('Cache-Control', 'private, no-store')
        res.json({ courses: await resourceModel.findCourses(req.query.category, true) })
    } catch (error) {
        console.error('Chargement des cours impossible :', error.code || error.name)
        res.status(500).json({ title: 'Impossible de charger les cours.', statut: 500, invalidParams: [] })
    }
}

exports.updateCourse = async (req, res) => {
    try {
        const course = await resourceModel.updateCourse(req.params.id, req.body)
        if (!course) return res.status(404).json({ title: 'Cours introuvable.', statut: 404, invalidParams: [] })
        res.json({ course })
    } catch (error) {
        const conflict = error.code === '23505' && error.constraint === 'resources_category_order_unique'
        console.error('Modification du cours impossible :', error.code || error.name)
        res.status(conflict ? 409 : 500).json({
            title: conflict ? 'Ordre indisponible.' : 'Impossible de modifier le cours.',
            statut: conflict ? 409 : 500,
            invalidParams: conflict ? [{ path: 'order_index', message: 'Cet ordre est déjà utilisé dans cette catégorie.' }] : []
        })
    }
}

exports.retireCourse = async (req, res) => {
    try {
        const course = await resourceModel.retireCourse(req.params.id)
        if (!course) return res.status(404).json({ title: 'Cours introuvable.', statut: 404, invalidParams: [] })
        res.status(204).end()
    } catch (error) {
        console.error('Retrait du cours impossible :', error.code || error.name)
        res.status(500).json({ title: 'Impossible de retirer le cours.', statut: 500, invalidParams: [] })
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
