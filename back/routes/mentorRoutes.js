'use strict'

const express = require('express')
const router = express.Router()
const { analyseCorrection, saveCorrection, getCorrections, deleteCorrection } = require('../controllers/mentorController')
const authMiddleware = require('../middlewares/authMiddleware')
const uploadImage = require('../middlewares/multerMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { saveCorrectionSchema } = require('../schemas/mentorSchemas')

// Toutes les routes du mentor nécessitent d'être connecté
router.post('/correction', authMiddleware, uploadImage, analyseCorrection)
router.post('/correctionSave', authMiddleware, validate(saveCorrectionSchema), saveCorrection)
router.get('/correctionGallery', authMiddleware, getCorrections)
router.delete('/correctionDelete/:id', authMiddleware, deleteCorrection)

module.exports = router