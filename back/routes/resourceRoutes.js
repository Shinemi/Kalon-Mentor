'use strict'

const express = require('express')
const router = express.Router()
const { getCourses, getCourseById } = require('../controllers/resourceController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/courses', getCourses)
router.get('/courses/:id', (req, res, next) => {
    if (req.headers.authorization) return authMiddleware(req, res, next)
    next()
}, getCourseById)

module.exports = router
