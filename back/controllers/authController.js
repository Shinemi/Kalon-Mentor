'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// POST /auth/register
async function register(req, res) {
    const { username, email, password } = req.body

    try {
        const existingUser = await userModel.findUserByEmail(email)
        if (existingUser) {
            return res.status(409).json({ message: 'An account already exists with this email' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await userModel.createUser(username, email, hashedPassword)

        res.status(201).json({ user, token: generateToken(user.id) })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while creating the account' })
    }
}

// POST /auth/login
async function login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' })
    }

    try {
        const user = await userModel.findUserByEmail(email)

        if (!user) {
            return res.status(401).json({ message: 'Incorrect email or password' })
        }

        const passwordMatches = await bcrypt.compare(password, user.password)
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Incorrect email or password' })
        }

        res.json({
            user: { id: user.id, username: user.username, email: user.email },
            token: generateToken(user.id),
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while logging in' })
    }
}

// GET /auth/profile (route protégée)
async function getProfile(req, res) {
    res.json({ user: req.user })
}

// PUT /auth/profileUpdate (route protégée)
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
        res.status(500).json({ message: 'Error while updating the profile' })
    }
}

module.exports = { register, login, getProfile, updateProfile }
