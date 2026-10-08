// Active le mode strict de JavaScript pour détecter les erreurs courantes.
'use strict'

const { z } = require('zod')

const registerSchema = z.object({

    username: z.string({ error: 'Le pseudo est requis.' })
        .trim()
        .min(2, { error: 'Le pseudo doit contenir au moins 2 caractères.' })
        .max(50, { error: 'Le pseudo ne peut pas dépasser 50 caractères.' }),

    password: z.string({ error: 'Le mot de passe est requis.' })
        .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères.' })
        .regex(/[0-9]/, { error: 'Le mot de passe doit contenir au moins un chiffre.' })
        .regex(/[^a-zA-Z0-9\s]/, { error: 'Le mot de passe doit contenir au moins un caractère spécial.' }),

    email: z.email({ error: 'L’adresse e-mail est requise.' })
        .trim()
        .toLowerCase()
}).strict() // Interdit les champs supplémentaires non définis.


const loginSchema = z.object({
    email: z.email({ error: 'L’adresse e-mail invalide.' })
        .trim()
        .toLowerCase(),
    // La complexité est vérifiée à l'inscription, pas à la connexion.
    password: z.string({ error: 'Le mot de passe est requis.' })
        .min(1, { error: 'Le mot de passe est requis.' }),
}).strict()

const updateProfileSchema = z.object({
    username: z.string({ error: 'Le pseudo est invalide.' })
        .trim()
        .min(2, { error: 'Le pseudo doit contenir au moins 2 caractères.' })
        .max(50, { error: 'Le pseudo ne peut pas dépasser 50 caractères.' })
        .optional(),

    password: z.string({ error: 'Le mot de passe est invalide.' })
        .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères.' })
        .regex(/[0-9]/, { error: 'Le mot de passe doit contenir au moins un chiffre.' })
        .regex(/[^a-zA-Z0-9\s]/, { error: 'Le mot de passe doit contenir au moins un caractère spécial.' })
        .optional(),

    email: z.email({ error: 'Adresse e-mail invalide.' })
        .trim()
        .toLowerCase()
        .optional(),
}).strict()
    .refine(
        data => data.username !== undefined || data.email !== undefined || data.password !== undefined,
        { error: 'Veuillez fournir au moins un champ à modifier.' }
    )

module.exports = { registerSchema, loginSchema, updateProfileSchema }
