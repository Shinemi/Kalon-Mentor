const express = require('express')
const router = express.Router()
const {
    analyseCorrection,
    saveCorrection,
    getCorrections,
    deleteCorrection,
} = require('../controllers/mentorController')
const authMiddleware = require('../middlewares/authMiddleware')
const uploadImage = require('../middlewares/multerMiddleware')

// Toutes les routes du mentor nécessitent d'être connecté
router.post('/correction', authMiddleware, uploadImage, analyseCorrection)
router.post('/correctionSave', authMiddleware, saveCorrection)
router.get('/correctionHistory', authMiddleware, getCorrections)
router.delete('/correctionDelete/:id', authMiddleware, deleteCorrection)

module.exports = router