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
// Analyse l'image et renvoie le feedback complet de l'IA. Rien n'est
// stocké à cette étape : l'utilisateur décide ensuite s'il garde la
// correction dans son historique.
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

        // La liste fermée dans laquelle l'IA doit choisir ses recommandations (US-06)
        const resources = await resourceModel.findAllResources()
        const feedback = await analyseDrawing(imageForAi, resources)

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

// À partir du feedback complet de l'IA, retrouve la ressource de priorité 1
// (s'il y en a une) et vérifie qu'elle existe vraiment en base avant de
// la lier à la correction.
async function resolvePrimaryResourceId(feedback) {
    const recommendations = feedback?.ressources_recommandees
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
        return null
    }

    const topPick =
        recommendations.find((resource) => resource.priorite === 1) ?? recommendations[0]

    if (!topPick?.ressource_id) {
        return null
    }

    const exists = await resourceModel.resourceExists(topPick.ressource_id)
    return exists ? topPick.ressource_id : null
}

// POST /mentor/corrections  (US-09)
// L'utilisateur a vu son feedback et choisit de le garder.
async function saveCorrection(req, res) {
    const { image, feedback } = req.body

    if (!image || !feedback) {
        return res.status(400).json({ message: 'image and feedback are required' })
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

        // On ne garde qu'un lien en base (schéma actuel = 1 seule ressource
        // par correction) ; le détail complet des recommandations reste
        // dans feedback_text pour l'affichage.
        const resourceId = await resolvePrimaryResourceId(feedback)

        const correction = await correctionModel.createCorrection(
            req.user.id,
            `/uploads/${filename}`,
            JSON.stringify(feedback),
            resourceId
        )

        res.status(201).json({ correction })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while saving the correction' })
    }
}

// GET /mentor/corrections  (US-10)
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