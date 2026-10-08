'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

function generateToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
}

// POST /auth/register
async function register(req, res) {
    const { username, email, password } = req.body

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
            hashedPassword
        )

        res.status(201).json({
            user,
            token: generateToken(user.id)
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
            token: generateToken(user.id)
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

module.exports = { register, login, getProfile, updateProfile }