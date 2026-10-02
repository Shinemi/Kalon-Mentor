const express = require('express')
const router = express.Router()
const { getCourses, getCourseById } = require('../controllers/resourceController')

router.get('/courses', getCourses)
router.get('/courses/:id', getCourseById)

module.exports = router