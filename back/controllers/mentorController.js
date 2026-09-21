const sharp = require('sharp')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')
const correctionModel = require('../models/correctionModel')
const resourceModel = require('../models/resourceModel')
const { analyseDrawing } = require('../services/aiService')

// Nombre de corrections sauvegardées max sur le plan gratuit
const MAX_SAVED_CORRECTIONS = 10

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// POST /mentor/correction  (US-04 + US-05)
// Analyse l'image et renvoie le feedback. Rien n'est stocké à cette étape :
// l'utilisateur décide ensuite s'il garde la correction dans son historique.
async function analyseCorrection(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'No image provided' })
    }

    try {
        // Version envoyée à l'IA : assez grande pour qu'elle voie les détails
        const imageForAi = await sharp(req.file.buffer)
            .rotate() // corrige l'orientation d'après les métadonnées EXIF
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer()

        // L'IA choisit parmi les catégories de cours réellement disponibles (US-06)
        const categories = await resourceModel.findAllCategories()
        const feedback = await analyseDrawing(imageForAi, categories)

        // Version légère pour l'historique, renvoyée au front qui nous la
        // renverra telle quelle s'il choisit de sauvegarder
        const imageForHistory = await sharp(req.file.buffer)
            .rotate()
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer()

        res.json({ feedback, image: imageForHistory.toString('base64') })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while analysing the drawing' })
    }
}

// POST /mentor/correctionSave  (US-09)
// L'utilisateur a vu son feedback et choisit de le garder.
async function saveCorrection(req, res) {
    const { image, feedbackText, category } = req.body

    if (!image || !feedbackText) {
        return res.status(400).json({ message: 'image and feedbackText are required' })
    }

    try {
        const savedCount = await correctionModel.countCorrectionsByUser(req.user.id)

        if (savedCount >= MAX_SAVED_CORRECTIONS) {
            return res.status(403).json({
                message: `Your gallery is full (${MAX_SAVED_CORRECTIONS} saved corrections). Delete one to make room.`,
            })
        }

        // Écriture du fichier compressé sur le disque
        await fs.mkdir(UPLOADS_DIR, { recursive: true })
        const filename = `${crypto.randomUUID()}.jpg`
        await fs.writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(image, 'base64'))

        // Si l'IA a suggéré une catégorie, on rattache une ressource (US-06)
        let resourceId = null
        if (category) {
            const resource = await resourceModel.findResourceByCategory(category)
            resourceId = resource?.id ?? null
        }

        const correction = await correctionModel.createCorrection(
            req.user.id,
            `/uploads/${filename}`,
            feedbackText,
            resourceId
        )

        res.status(201).json({ correction })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while saving the correction' })
    }
}

// GET /mentor/correctionGallery  (US-10)
async function getCorrections(req, res) {
    try {
        const corrections = await correctionModel.findCorrectionsByUser(req.user.id)

        res.json({
            corrections,
            savedCount: corrections.length,
            maxCorrections: MAX_SAVED_CORRECTIONS,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while fetching the gallery' })
    }
}

// DELETE /mentor/corrections/:id
async function deleteCorrection(req, res) {
    try {
        const deleted = await correctionModel.deleteCorrection(req.params.id, req.user.id)

        if (!deleted) {
            return res.status(404).json({ message: 'Correction not found' })
        }

        // On supprime aussi le fichier pour ne pas laisser d'images orphelines
        const filename = path.basename(deleted.image_url)
        await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => {})

        res.json({ message: 'Correction deleted' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while deleting the correction' })
    }
}

module.exports = { analyseCorrection, saveCorrection, getCorrections, deleteCorrection }