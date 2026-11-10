'use strict'

const { z } = require('zod')

const textSchema = z.string({ error: 'Un texte est attendu.' })
    .trim()
    .min(1, { error: 'Ce champ est requis.' })

const createCourseSchema = z.object({
    title: textSchema.max(200, { error: 'Le titre ne peut pas dépasser 200 caractères.' }),

    category: z.enum([
        'proportions', 'anatomie', 'perspective',
        'composition', 'couleurs', 'lumiere'
    ], { error: 'Choisissez une catégorie valide.' }),

    order_index: z.number({ error: 'L’ordre doit être un nombre.' })
        .int({ error: 'L’ordre doit être un nombre entier.' })
        .positive({ error: 'L’ordre doit être supérieur à zéro.' })
        .max(2147483647, { error: 'L’ordre est trop élevé.' }),

    author_name: z.string({ error: 'Le nom de l’auteur doit être un texte.' })
        .trim()
        .max(100, { error: 'Le nom de l’auteur ne peut pas dépasser 100 caractères.' })
        .optional(),

    content: z.object({
        level: textSchema,
        lesson: textSchema,
        exercise: textSchema,
        objectives: z.array(textSchema, { error: 'Les objectifs doivent être une liste.' }).default([]),
        commonMistakes: z.array(textSchema, { error: 'Les erreurs fréquentes doivent être une liste.' }).default([])
    }, { error: 'Le contenu du cours est requis.' }).strict()
}, { error: 'Les données du cours doivent être un objet.' }).strict()

module.exports = { createCourseSchema }