require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')


const app = express()
const port = process.env.PORT || 3000

// Helmet : sécurisation des headers HTTP
app.use(
    helmet({
        //la CSP (content security policy)
        //pour une api purement JSON, on désactive la CSP
        contentSecurityPolicy: false,
        //si votre API interagit avec d'autres domaines
        crossOriginResourcePolicy:{policy:"cross-origin"}
    })
)

// CORS : autorise les requêtes venant du frontend
const corsoptions = {
    origin: ['http://localhost:3000']
}
app.use(cors(corsoptions))

// Rate limit global
const limiter = rateLimit({
    windowMs: 15*60*1000, // fenetre de 15 minutes
    limit:100, // max 100 requetes par IP sur ce créneau
    message: {status : 429,error: 'trop de requete, ressayez plus tard'}
})

app.use(limiter)

// limite relevée : on reçoit des images compressées encodées en base64
app.use(express.json({ limit: '5mb' }))

// Routes
const authRoutes = require('./routes/authRoutes')
const mentorRoutes = require('./routes/mentorRoutes')

app.use('/api/v1/auth', authRoutes)
// app.use('/api/v1/mentor', mentorRoutes)

// images de la galerie accessibles via http://localhost:3000/uploads/xxx.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => {
    res.send('bienvenue sur mon API RESTful !')
})

// Gestion des erreurs d'upload (fichier trop lourd, mauvais format)
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image is too large (10 MB max)' })
    }
    if (err.message === 'Only image files are allowed') {
        return res.status(400).json({ message: err.message })
    }
    console.error(err)
    res.status(500).json({ message: 'Unexpected server error' })
})

// On ne démarre le serveur que si ce fichier est lancé directement
// (node app.js / nodemon app.js), pas quand il est require() par les tests.
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Serveur lancé sur http://localhost:${port}`)
    })
}

module.exports = app