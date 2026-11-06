'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const correctionModel = require('../models/correctionModel')
const { del } = require('@vercel/blob')
const crypto = require('node:crypto')
const { setTimeout: wait } = require('node:timers/promises')
const { sendPasswordResetEmail } = require('../services/emailService')

function generateToken(userId, tokenVersion = 0) {
    return jwt.sign(
        { id: userId, tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
}

// POST /auth/register
async function register(req, res) {
    const { username, email, password, termsVersion } = req.body

    try {
        const existingUser = await userModel.findUserByEmail(email)

        if (existingUser) {
            return res.status(409).json({
                title: 'Un compte existe déjà avec cette adresse e-mail.',
                statut: 409,
                invalidParams: [
                    {
                        path: 'email',
                        message: 'Cette adresse e-mail est déjà utilisée.'
                    }
                ]
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await userModel.createUser(
            username,
            email,
            hashedPassword,
            termsVersion
        )

        res.status(201).json({
            user,
            token: generateToken(user.id, user.token_version)
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            title: 'Erreur lors de la création du compte.',
            statut: 500,
            invalidParams: []
        })
    }
}

// POST /auth/login
async function login(req, res) {
    const { email, password } = req.body

    try {
        const user = await userModel.findUserByEmail(email)

        if (!user) {
            return res.status(401).json({
                title: 'Adresse e-mail ou mot de passe incorrect.',
                statut: 401,
                invalidParams: []
            })
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        )

        if (!passwordMatches) {
            return res.status(401).json({
                title: 'Adresse e-mail ou mot de passe incorrect.',
                statut: 401,
                invalidParams: []
            })
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token: generateToken(user.id, user.token_version)
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            title: 'Erreur lors de la connexion.',
            statut: 500,
            invalidParams: []
        })
    }
}

// GET /auth/profile
async function getProfile(req, res) {
    res.json({ user: req.user })
}

// PUT /auth/profileUpdate
async function updateProfile(req, res) {
    const { username, email, password } = req.body

    try {
        const fields = { username, email }

        if (password) {
            fields.password = await bcrypt.hash(password, 10)
        }

        const user = await userModel.updateUser(req.user.id, fields)

        res.json({ user })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            title: 'Erreur lors de la modification du profil.',
            statut: 500,
            invalidParams: []
        })
    }
}

async function deleteAccount(req, res) {
    try {
        const corrections = await correctionModel.findCorrectionsByUser(req.user.id)
        const imageUrls = corrections.map(correction => correction.image_url)

        if (imageUrls.length > 0) {
            await del(imageUrls, {
                token: process.env.BLOB_READ_WRITE_TOKEN
            })
        }

        await userModel.deleteUser(req.user.id)

        res.status(204).end()
    } catch (error) {
        console.error(error)

        res.status(500).json({
            title: 'La suppression du compte n’a pas pu être terminée. Réessayez ou contactez l’assistance.',
            statut: 500,
            invalidParams: []
        })
    }
}


async function forgotPassword(req, res) {
    const startedAt = Date.now()

    try {
        const user = await userModel.findUserByEmail(req.body.email)

        if (user) {
            const token = crypto.randomBytes(32).toString('hex')
            const tokenHash = crypto.createHash('sha256')
                .update(token)
                .digest('hex')

            const saved = await userModel.savePasswordResetToken(
                user.id,
                tokenHash
            )

            if (saved) {
                try {
                    await sendPasswordResetEmail(user.email, token)
                } catch (error) {
                    await userModel.clearPasswordResetToken(
                        user.id,
                        tokenHash
                    )

                    throw error
                }
            }
        }
    } catch (error) {
        console.error(
            'Échec de la demande de réinitialisation :',
            error.name
        )
    }

    await wait(Math.max(0, 1000 - (Date.now() - startedAt)))

    res.status(202).json({
        message: 'Si un compte correspond à cette adresse, un e-mail de réinitialisation a été envoyé.'
    })
}

async function resetPassword(req, res) {
    try {
        const tokenHash = crypto.createHash('sha256')
            .update(req.body.token)
            .digest('hex')

        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const user = await userModel.resetPassword(
            tokenHash,
            hashedPassword
        )

        if (!user) {
            return res.status(400).json({
                title: 'Ce lien est invalide ou a expiré. Demandez un nouveau lien.',
                statut: 400,
                invalidParams: [
                    {
                        path: 'token',
                        message: 'Ce lien est invalide ou a expiré.'
                    }
                ]
            })
        }

        res.json({
            message: 'Votre mot de passe a été modifié. Vous pouvez vous connecter.'
        })
    } catch (error) {
        console.error(
            'Échec de la réinitialisation :',
            error.name
        )

        res.status(500).json({
            title: 'Impossible de modifier le mot de passe. Réessayez plus tard.',
            statut: 500,
            invalidParams: []
        })
    }
}

module.exports = { register, login, getProfile, updateProfile, deleteAccount, resetPassword, forgotPassword }
