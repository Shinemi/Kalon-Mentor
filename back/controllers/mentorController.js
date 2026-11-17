'use strict'

const sharp = require('sharp')
const correctionModel = require('../models/correctionModel')
const resourceModel = require('../models/resourceModel')
const { analyseDrawing } = require('../services/aiService')
const imageStorage = require('../services/imageStorage')
const { get, del } = require('@vercel/blob')
const { randomUUID } = require('node:crypto')
const { z } = require('zod')
const analysisModel = require('../models/analysisModel')
const { analysisFeedbackSchema } = require('../schemas/mentorSchemas')


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

    const requestId = randomUUID()
    const controller = new AbortController()
    let timer
    let reserved = false
    try {
        const reservation = await analysisModel.reserveAnalysis(requestId, req.user.id)
        if (!reservation.allowed) {
            const busy = reservation.reason === 'busy'
            return res.status(busy ? 409 : 429).json({
                title: busy ? 'Une analyse est déjà en cours pour votre compte.'
                    : reservation.reason === 'monthly' ? 'Votre quota de 10 analyses réussies ce mois-ci est atteint.'
                        : 'Votre quota de 2 analyses réussies aujourd’hui est atteint.',
                statut: busy ? 409 : 429, invalidParams: [], reason: reservation.reason
            })
        }
        reserved = true
        res.set('X-Analysis-Accepted', 'true')
        const timeout = new Promise((resolve, reject) => {
            timer = setTimeout(() => {
                controller.abort()
                reject(Object.assign(new Error('Délai maximal atteint'), { code: 'ANALYSIS_TIMEOUT' }))
            }, 120000)
        })

        const work = async () => {
            const metadata = await sharp(req.file.buffer).metadata().catch(() => null)
            if (!metadata || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
                throw Object.assign(new Error('Image invalide'), { code: 'INVALID_IMAGE' })
            }

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
            const feedback = analysisFeedbackSchema.parse(await analyseDrawing(imageForAi, resources, controller.signal))
            const activeResources = await resourceModel.findAllResources()
            const seen = new Set()
            feedback.ressources_recommandees = (feedback.ressources_recommandees || [])
                .sort((a, b) => (a.priorite ?? 99) - (b.priorite ?? 99))
                .flatMap(recommendation => {
                    const resource = activeResources.find(item => item.id === recommendation.ressource_id)
                    if (!resource || seen.has(resource.id)) return []
                    seen.add(resource.id)
                    return [{ ...recommendation, titre: resource.title, type: 'course', categorie: resource.category }]
                }).slice(0, 3)
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

            controller.signal.throwIfAborted()
            if (!await analysisModel.finishAnalysis(requestId, req.user.id, controller.signal)) {
                throw Object.assign(new Error('Réservation expirée'), { code: 'ANALYSIS_TIMEOUT' })
            }
            return { feedback, image: imageForHistory.toString('base64'), analysisId: requestId }
        }
        const result = await Promise.race([work(), timeout])
        controller.signal.throwIfAborted()
        res.json(result)
        
    } catch (error) {
        console.error('Analyse impossible :', error.code || error.name)

        if (error.code === 'INVALID_IMAGE') {
            return res.status(400).json({ title: 'Image invalide. Utilisez JPEG, PNG ou WebP.', statut: 400, invalidParams: [{ path: 'image', message: 'Le fichier doit être une image décodable.' }] })
        }

        if (error.code === 'ANALYSIS_TIMEOUT' || controller.signal.aborted) {
            return res.status(504).json({ title: 'Le délai de 120 secondes est dépassé. Vous pouvez réessayer, sans débit de votre quota.', statut: 504, invalidParams: [] })
        }

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
    } finally {
        clearTimeout(timer)
        controller.abort()
        if (reserved) {
            await analysisModel.releaseAnalysis(requestId, req.user.id).catch(error => {
                console.error('Libération du verrou impossible :', error.code || error.name)
            })
        }
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
        if (exists && !validIds.includes(resource.ressource_id)) validIds.push(resource.ressource_id)
        if (validIds.length === 3) break
    }

    return validIds
}

// POST /mentor/corrections  (US-09)
// L'utilisateur a vu son feedback et choisit de le garder.
async function saveCorrection(req, res) {
    const { image } = req.body
    const feedback = { ...req.body.feedback }
    const key = req.get('Idempotency-Key')
    if (key && !z.uuid().safeParse(key).success) {
        return res.status(422).json({ title: 'Clé de sauvegarde invalide.', statut: 422, invalidParams: [] })
    }

    try {
        if (key) {
            const existing = await correctionModel.findCorrectionById(key, req.user.id)
            if (existing) return res.status(201).json({ correction: existing })
        }
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
        const seen = new Set()
        feedback.ressources_recommandees = (feedback.ressources_recommandees || [])
            .filter(item => {
                if (!resourceIds.includes(item.ressource_id) || seen.has(item.ressource_id)) return false
                seen.add(item.ressource_id)
                return true
            })

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
                resourceIds,
                ...(key ? [key] : [])
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
                    cleanupError.code || cleanupError.name
                )
            }

            throw error
        }

        if (correction.image_url && correction.image_url !== blob.url) {
            await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(error => {
                console.error('Nettoyage du doublon Blob à reprendre :', blob.pathname, error.code || error.name)
                throw error
            })
        }

        res.status(201).json({ correction })
    } catch (error) {
        console.error('Sauvegarde impossible :', error.code || error.name)
        if (error.code === 'GALLERY_FULL') {
            return res.status(403).json({ title: 'Votre galerie est pleine. Supprimez une analyse pour libérer une place.', statut: 403, invalidParams: [], maxCorrections: MAX_SAVED_CORRECTIONS })
        }

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
        console.error('Chargement de la galerie impossible :', error.code || error.name)
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
        console.error('Suppression de l’analyse impossible :', error.code || error.name)

        res.status(500).json({
            title: 'La suppression n’a pas pu être terminée. Réessayez.',
            statut: 500,
            invalidParams: []
        })
    }
}

module.exports = { analyseCorrection, saveCorrection, getCorrections, deleteCorrection }
