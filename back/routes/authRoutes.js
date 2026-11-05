'use strict'

const express = require ('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const { register, login, getProfile, updateProfile, deleteAccount, forgotPassword, resetPassword } = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas/authSchemas')

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { title: 'Trop de demandes. Réessayez dans 15 minutes.', statut: 429, invalidParams: [] }
})

router.post('/forgotPassword', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/resetPassword', passwordResetLimiter, validate(resetPasswordSchema), resetPassword)

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/profile', authMiddleware, getProfile)
router.put('/profileUpdate', authMiddleware, validate(updateProfileSchema), updateProfile)
router.delete('/profile', authMiddleware, deleteAccount)

module.exports = router
