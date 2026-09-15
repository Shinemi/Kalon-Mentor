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

    if (
        !validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 0,
            minUppercase: 0,
            minNumbers: 1,
            minSymbols: 1,
        })
    ) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long and contain at least one number and one special character',
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


// GET /auth/profile (route protégée par authMiddleware)
// authMiddleware a déjà récupéré l'utilisateur et l'a mis dans req.user
async function getProfile(req, res) {
    res.json({ user: req.user })
}
 
// PUT /auth/profile (route protégée par authMiddleware)
// Met à jour les champs fournis dans le body : username, email, password
// (au moins un des trois, tous optionnels)
async function updateProfile(req, res) {
    const { username, email, password } = req.body
 
    if (!username && !email && !password) {
        return res.status(400).json({ message: 'Provide at least one field to update' })
    }
 
    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email' })
    }
 
    if (
        password &&
        !validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 0,
            minUppercase: 0,
            minNumbers: 1,
            minSymbols: 1,
        })
    ) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long and contain at least one number and one special character',
        })
    }
 
    try {
        // On construit la requête petit à petit, selon les champs fournis
        const fieldsToUpdate = []
        const values = []
 
        if (username) {
            values.push(username)
            fieldsToUpdate.push(`username = $${values.length}`)
        }
 
        if (email) {
            values.push(email)
            fieldsToUpdate.push(`email = $${values.length}`)
        }
 
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10)
            values.push(hashedPassword)
            fieldsToUpdate.push(`password = $${values.length}`)
        }
 
        values.push(req.user.id)
 
        const result = await db.query(
            `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = $${values.length}
             RETURNING id, username, email`,
            values
        )
 
        res.json({ user: result.rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error while updating the profile' })
    }
}
 
module.exports = { register, login, getProfile, updateProfile }