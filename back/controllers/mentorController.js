'use strict'

const sharp = require('sharp')
const correctionModel = require('../models/correctionModel')
const resourceModel = require('../models/resourceModel')
const { analyseDrawing } = require('../services/aiService')
const imageStorage = require('../services/imageStorage')
const { get, del } = require('@vercel/blob')

const MAX_SAVED_CORRECTIONS = 10

// const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// POST /mentor/correction  (US-04 + US-05)
async function analyseCorrection(req, res) {
    if (!req.file) {
        return res.status(400).json({
            title: 'No image provided',
            statut: 400,
            invalidParams: [{ path: 'image', message: 'No image provided' }]
        })
    }

    try {
        // Image envoyée à Gemini.
        const imageForAi = await sharp(req.file.buffer)
            .rotate()
            .resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer()

        const resources = await resourceModel.findAllResources()
        const feedback = await analyseDrawing(imageForAi, resources)

        // Version légère pour l’historique.
        const imageForHistory = await sharp(req.file.buffer)
            .rotate()
            .resize({
                width: 800,
                height: 800,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer()

        res.json({ feedback, image: imageForHistory.toString('base64') })
    } catch (error) {
        console.error(error)

        if (error.code === 'AI_UNAVAILABLE') {
            return res.status(503).json({
                title: 'Le mentor est temporairement indisponible.',
                statut: 503,
                invalidParams: []
            })
        }

        res.status(500).json({
            title: 'Error while analysing the drawing',
            statut: 500,
            invalidParams: []
        })
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

    try {
        const savedCount = await correctionModel.countCorrectionsByUser(
            req.user.id
        )

        if (savedCount >= MAX_SAVED_CORRECTIONS) {
            return res.status(403).json({
                title: 'Votre galerie est pleine. Supprimez une analyse pour libérer une place.',
                statut: 403,
                invalidParams: [],
                maxCorrections: MAX_SAVED_CORRECTIONS
            })
        }

        const resourceIds = await resolveResourceIds(feedback)

        const blob = await imageStorage.saveImage(
            Buffer.from(image, 'base64'),
            req.user.id
        )

        let correction

        try {
            correction = await correctionModel.createSaveCorrection(
                req.user.id,
                blob.url,
                JSON.stringify(feedback),
                resourceIds
            )
        } catch (error) {
            try {
                await del(blob.url, {
                    token: process.env.BLOB_READ_WRITE_TOKEN
                })
            } catch (cleanupError) {
                console.error(
                    'Nettoyage Blob à reprendre :',
                    blob.pathname,
                    cleanupError
                )
            }

            throw error
        }

        res.status(201).json({ correction })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            title: 'La sauvegarde a échoué. Votre analyse reste affichée ; vous pouvez réessayer.',
            statut: 500,
            invalidParams: []
        })
    }
}

// GET /mentor/corrections  (US-10)
async function getCorrections(req, res) {
    try {
        const corrections = await correctionModel.findCorrectionsByUser(req.user.id)

        for (const correction of corrections) {
            const image = await get(correction.image_url, {
                access: 'private',
                token: process.env.BLOB_READ_WRITE_TOKEN
            })

            if (!image || image.statusCode === 404) {
                correction.image = ''
                continue
            }

            if (image.statusCode !== 200) {
                throw new Error('Impossible de récupérer un dessin sauvegardé.')
            }

            const imageBuffer = await new Response(image.stream).arrayBuffer()
            correction.image = Buffer.from(imageBuffer).toString('base64')
        }

        res.set('Cache-Control', 'private, no-store')

        res.json({
            corrections,
            savedCount: corrections.length,
            maxCorrections: MAX_SAVED_CORRECTIONS,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            title: 'Error while fetching the gallery',
            statut: 500,
            invalidParams: []
        })
    }
}

// DELETE /mentor/corrections/:id
async function deleteCorrection(req, res) {
    try {
        const correction = await correctionModel.findCorrectionById(
            req.params.id,
            req.user.id
        )

        if (!correction) {
            return res.status(404).json({
                title: 'Analyse introuvable.',
                statut: 404,
                invalidParams: [
                    { path: 'id', message: 'Analyse introuvable.' }
                ]
            })
        }

        await del(correction.image_url, {
            token: process.env.BLOB_READ_WRITE_TOKEN
        })

        await correctionModel.deleteCorrection(
            req.params.id,
            req.user.id
        )

        res.json({ message: 'Analyse supprimée.' })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            title: 'La suppression n’a pas pu être terminée. Réessayez.',
            statut: 500,
            invalidParams: []
        })
    }
}

module.exports = { analyseCorrection, saveCorrection, getCorrections, deleteCorrection }
