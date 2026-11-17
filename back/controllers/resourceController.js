'use strict'

const resourceModel = require('../models/resourceModel')

// GET /resources/courses
async function getCourses(req, res) {
    try {
        const courses = await resourceModel.findCourses(req.query.category)

        res.json({ courses })
    } catch (error) {
        console.error('Chargement des cours impossible :', error.code || error.name)
        res.status(500).json({
            title: 'Error while fetching courses',
            statut: 500,
            invalidParams: []
        })
    }
}

// GET /resources/courses/:id
async function getCourseById(req, res) {
    try {
        const course = await resourceModel.findCourseById(req.params.id)

        const retired = course?.is_active === false
        if (!course || (retired && (!req.user ||
            !await resourceModel.canAccessRetiredCourse(req.params.id, req.user.id)))) {
            return res.status(404).json({
                title: 'Course not found',
                statut: 404,
                invalidParams: [{ path: 'id', message: 'Course not found' }]
            })
        }

        if (retired) res.set('Cache-Control', 'private, no-store')
        res.json({ course })
    } catch (error) {
        console.error('Chargement du cours impossible :', error.code || error.name)
        res.status(500).json({
            title: 'Error while fetching the course',
            statut: 500,
            invalidParams: []
        })
    }
}

module.exports = { getCourses, getCourseById }
