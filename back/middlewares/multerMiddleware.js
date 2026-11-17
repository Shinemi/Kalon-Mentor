'use strict'

const multer = require('multer')

// memoryStorage : le fichier reste en mémoire (req.file.buffer)
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        return cb(new Error('Only image files are allowed'), false)
    }
    cb(null, true)
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
})

module.exports = upload.single('image')
