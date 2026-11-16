'use strict'

const express = require('express')
const helmet = require('helmet')
const swaggerUi = require('swagger-ui-express')
const specification = require('../docs/openapi')

const router = express.Router()

router.get('/api-docs.json', (req, res) => {
    res.json(specification)
})

router.use('/api-docs',
    // Permet les assets Swagger en HTTP local sans affaiblir la CSP de l'API.
    helmet.contentSecurityPolicy({ directives: { upgradeInsecureRequests: null } }),
    swaggerUi.serve,
    swaggerUi.setup(null, {
        customSiteTitle: 'Documentation API — Kalon Mentor',
        swaggerOptions: {
            url: '/api-docs.json',
            validatorUrl: null,
            persistAuthorization: false,
            docExpansion: 'list',
            displayRequestDuration: true
        }
    })
)

module.exports = router
