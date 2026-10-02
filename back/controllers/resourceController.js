const resourceModel = require('../models/resourceModel')

// GET /resources/courses
// Récupère tous les cours, avec possibilité de filtrer par catégorie.
async function getCourses(req, res) {
    try {
        const courses = await resourceModel.findCourses(req.query.category)

        res.json({ courses })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while fetching courses' })
    }
}

// GET /resources/courses/:id
// Récupère un cours précis.
async function getCourseById(req, res) {
    try {
        const course = await resourceModel.findCourseById(req.params.id)

        if (!course) {
            return res.status(404).json({ message: 'Course not found' })
        }

        res.json({ course })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while fetching the course' })
    }
}

module.exports = { getCourses, getCourseById }