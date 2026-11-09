'use strict'

const express = require('express')
const router = express.Router()
const {
    register,
    login,
    getProfile,
    updateProfile,
    deleteAccount,
    forgotPassword,
    resetPassword
} = require('../controllers/authController')

const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} = require('../schemas/authSchemas')

const authMiddleware = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const rateLimit = require('express-rate-limit')

const limiterOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: 'draft-8',
    legacyHeaders: false
}

const loginLimiter = rateLimit({
    ...limiterOptions,
    limit: 10,
    skipSuccessfulRequests: true,
    message: {
        title: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
        statut: 429,
        invalidParams: []
    }
})

const registerLimiter = rateLimit({
    ...limiterOptions,
    limit: 5,
    message: {
        title: 'Trop de tentatives d’inscription. Réessayez dans quelques minutes.',
        statut: 429,
        invalidParams: []
    }
})

const passwordResetLimiter = rateLimit({
    ...limiterOptions,
    limit: 5,
    message: {
        title: 'Trop de demandes. Réessayez dans quelques minutes.',
        statut: 429,
        invalidParams: []
    }
})

router.post('/forgotPassword', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/resetPassword', passwordResetLimiter, validate(resetPasswordSchema), resetPassword)

router.post('/register', registerLimiter, validate(registerSchema), register)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.get('/profile', authMiddleware, getProfile)
router.put('/profileUpdate', authMiddleware, validate(updateProfileSchema), updateProfile)
router.delete('/profile', authMiddleware, deleteAccount)

module.exports = router
