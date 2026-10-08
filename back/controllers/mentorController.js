'use strict'

const sharp = require('sharp')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')
const correctionModel = require('../models/correctionModel')
const resourceModel = require('../models/resourceModel')
const { analyseDrawing } = require('../services/aiService')

const MAX_SAVED_CORRECTIONS = 10

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// POST /mentor/correction  (US-04 + US-05)
async function analyseCorrection(req, res) {
    if (!req.file) {
        return res.status(400).json({ title: 'No image provided', statut: 400, invalidParams: [{ path: 'image', message: 'No image provided' }] })
    }

    try {
        // Version envoyée à l'IA : assez grande pour qu'elle voie les détails
        const imageForAi = await sharp(req.file.buffer)
            .rotate()
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer()

        const resources = await resourceModel.findAllResources()
        const feedback = await analyseDrawing(imageForAi, resources)

        // Version légère pour l'historique
        const imageForHistory = await sharp(req.file.buffer)
            .rotate()
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer()

        res.json({ feedback, image: imageForHistory.toString('base64') })
    } catch (error) {
        console.error(error)
        res.status(500).json({ title: 'Error while analysing the drawing', statut: 500, invalidParams: [] })
    }
}


// 3 premières — une ligne par ressource dans corrections_resources.
async function resolveResourceIds(feedback) {
    const recommendations = feedback?.ressources_recommandees
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
        return []
    }

    const sorted = [...recommendations].sort(
        (a, b) => (a.priorite ?? 99) - (b.priorite ?? 99)
    )

    const validIds = []
    for (const resource of sorted) {
        if (!resource?.ressource_id) continue
        const exists = await resourceModel.resourceExists(resource.ressource_id)
        if (exists) validIds.push(resource.ressource_id)
        if (validIds.length === 3) break
    }

    return validIds
}

// POST /mentor/corrections  (US-09)
// L'utilisateur a vu son feedback et choisit de le garder.
async function saveCorrection(req, res) {
    const { image, feedback } = req.body

    if (!image || !feedback) {
        return res.status(400).json({
            title: 'image and feedback are required',
            statut: 400,
            invalidParams: [
                ...(!image ? [{ path: 'image', message: 'L’image est requise.' }] : []),
                ...(!feedback ? [{ path: 'feedback', message: 'Le retour d’analyse est requis.' }] : []),
            ],
        })
    }

    try {
        const savedCount = await correctionModel.countCorrectionsByUser(req.user.id)

        if (savedCount >= MAX_SAVED_CORRECTIONS) {
            return res.status(403).json({
                title: `Your gallery is full (${MAX_SAVED_CORRECTIONS} saved corrections). Delete one to make room.`,
                statut: 403,
                invalidParams: [],
            })
        }

        // Écriture du fichier compressé sur le disque
        await fs.mkdir(UPLOADS_DIR, { recursive: true })
        const filename = `${crypto.randomUUID()}.jpg`
        await fs.writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(image, 'base64'))

        // Jusqu'à 3 ressources liées en base (table corrections_resources) ;
        const resourceIds = await resolveResourceIds(feedback)

        const correction = await correctionModel.createCorrection(
            req.user.id,
            `/uploads/${filename}`,
            JSON.stringify(feedback),
            resourceIds
        )

        res.status(201).json({ correction })
    } catch (error) {
        console.error(error)
        res.status(500).json({ title: 'Error while saving the correction', statut: 500, invalidParams: [] })
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
        res.status(500).json({ title: 'Error while fetching the gallery', statut: 500, invalidParams: [] })
    }
}

// DELETE /mentor/corrections/:id
async function deleteCorrection(req, res) {
    try {
        const deleted = await correctionModel.deleteCorrection(req.params.id, req.user.id)

        if (!deleted) {
            return res.status(404).json({ title: 'Correction not found', statut: 404, invalidParams: [{ path: 'id', message: 'Correction not found' }] })
        }

        // On supprime aussi le fichier pour ne pas laisser d'images orphelines
        const filename = path.basename(deleted.image_url)
        await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => {})

        res.json({ message: 'Correction deleted' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ title: 'Error while deleting the correction', statut: 500, invalidParams: [] })
    }
}

module.exports = { analyseCorrection, saveCorrection, getCorrections, deleteCorrection }
