'use strict'

const express = require ('express')
const router = express.Router()
const { register, login, getProfile, updateProfile } = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { registerSchema, loginSchema } = require('../schemas/authSchemas')

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/profile', authMiddleware, getProfile)
router.put('/profileUpdate', authMiddleware, updateProfile)

module.exports = router