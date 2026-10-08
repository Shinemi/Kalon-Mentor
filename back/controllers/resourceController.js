'use strict'

const resourceModel = require('../models/resourceModel')

// GET /resources/courses
async function getCourses(req, res) {
    try {
        const courses = await resourceModel.findCourses(req.query.category)

        res.json({ courses })
    } catch (error) {
        console.error(error)
        res.status(500).json({ title: 'Error while fetching courses', statut: 500, invalidParams: [] })
    }
}

// GET /resources/courses/:id
async function getCourseById(req, res) {
    try {
        const course = await resourceModel.findCourseById(req.params.id)

        if (!course) {
            return res.status(404).json({ title: 'Course not found', statut: 404, invalidParams: [{ path: 'id', message: 'Course not found' }] })
        }

        res.json({ course })
    } catch (error) {
        console.error(error)
        res.status(500).json({ title: 'Error while fetching the course', statut: 500, invalidParams: [] })
    }
}

module.exports = { getCourses, getCourseById }