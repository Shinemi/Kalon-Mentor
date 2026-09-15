const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const db = require('../db/db')

// POST /auth/register
async function register(req, res) {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'username, email and password are required' })
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email' })
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)

    if (!hasNumber || !hasSpecialChar) {
        return res.status(400).json({
            message: 'Password must contain at least one number and one special character',
        })
    }

    try {
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email])
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'An account already exists with this email' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await db.query(
            `INSERT INTO users (username, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, username, email`,
            [username, email, hashedPassword]
        )

        const user = result.rows[0]
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.status(201).json({ user, token })
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
        const result = await db.query('SELECT id, username, email, password FROM users WHERE email = $1', [email])
        const user = result.rows[0]

        if (!user) {
            return res.status(401).json({ message: 'Incorrect email or password' })
        }

        const passwordMatches = await bcrypt.compare(password, user.password)
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Incorrect email or password' })
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.json({
            user: { id: user.id, username: user.username, email: user.email },
            token,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while logging in' })
    }
}

module.exports = { register, login }