require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const app = express()
const port = process.env.PORT || 3000

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('bienvenue sur mon API RESTful !')
})

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`)
})