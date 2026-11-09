'use strict'

const express = require('express')
const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')
const adminMiddleware = require('../middlewares/adminMiddleware')
const { getUsers, getAiStatus } = require('../controllers/adminController')

router.use(authMiddleware, adminMiddleware)

router.get('/access', (req, res) => { res.json({ message: 'Accès administrateur autorisé.' })})
router.get('/users', getUsers)
router.get('/ai/status', getAiStatus)

module.exports = router