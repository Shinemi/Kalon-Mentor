'use strict'

const express = require('express')
const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')
const adminMiddleware = require('../middlewares/adminMiddleware')
const { getUsers, getAiStatus, getUserAnalyses, createCourse, getCourses, updateCourse, retireCourse } = require('../controllers/adminController')
const validate = require('../middlewares/validateMiddleware')
const { createCourseSchema, updateCourseSchema, courseIdSchema } = require('../schemas/courseSchemas')

router.use(authMiddleware, adminMiddleware)

router.param('id', (req, res, next, id) => {
    if (!courseIdSchema.safeParse(id).success) {
        return res.status(422).json({ title: 'Identifiant invalide.', statut: 422, invalidParams: [{ path: 'id', message: 'Un UUID valide est attendu.' }] })
    }
    next()
})

router.post('/courses', validate(createCourseSchema), createCourse)
router.get('/courses', getCourses)
router.patch('/courses/:id', validate(updateCourseSchema), updateCourse)
router.delete('/courses/:id', retireCourse)
router.get('/users/:id/analyses', getUserAnalyses)
router.get('/access', (req, res) => { res.json({ message: 'Accès administrateur autorisé.' })})
router.get('/users', getUsers)
router.get('/ai/status', getAiStatus)


module.exports = router
