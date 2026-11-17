'use strict'

const { z } = require('zod')

const recommendedResourceSchema = z.looseObject({
    ressource_id: z.uuid({
        error: 'L’identifiant de la ressource est invalide.'
    }),

    priorite: z.number({
        error: 'La priorité doit être un nombre.'
    })
        .int({ error: 'La priorité doit être un nombre entier.' })
        .positive({ error: 'La priorité doit être supérieure à zéro.' })
        .optional()
})

const feedbackSchema = z.looseObject({
    resume: z.string({
        error: 'Le résumé de l’analyse est requis.'
    })
        .trim()
        .min(1, { error: 'Le résumé ne doit pas être vide.' }),

    score_global: z.number({
        error: 'Le score global doit être un nombre.'
    })
        .min(0, { error: 'Le score ne peut pas être inférieur à zéro.' })
        .max(100, { error: 'Le score ne peut pas dépasser 100.' })
        .nullable()
        .optional(),

    ressources_recommandees: z.array(
        recommendedResourceSchema,
        { error: 'Les ressources recommandées doivent être un tableau.' }
    ).optional()
})

const saveCorrectionSchema = z.object({
    image: z.base64({
        error: 'L’image doit être une chaîne encodée en base64.'
    })
        .min(1, { error: 'L’image est requise.' }),

    feedback: feedbackSchema
}).strict()

const detailSchema = z.object({
    score: z.number().min(0).max(100).nullable(),
    commentaire: z.string().trim().min(1),
    points_forts: z.array(z.string()),
    problemes: z.array(z.string()),
    competences_a_travailler: z.array(z.string())
})

const analysisFeedbackSchema = feedbackSchema.extend({
    analyse: z.object({
        anatomie: detailSchema, perspective: detailSchema, composition: detailSchema,
        couleurs: detailSchema, lumiere: detailSchema
    }).strict()
})

module.exports = { saveCorrectionSchema, feedbackSchema, analysisFeedbackSchema }
