'use strict'

const { put } = require('@vercel/blob')
const sharp = require('sharp')
const crypto = require('crypto')

exports.saveImage = async (imageBuffer, userId) => {
    const webp = await sharp(imageBuffer)
        .rotate()
        .resize({
            width: 800,
            height: 800,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer()

    const blob = await put(
        `drawings/${userId}/${crypto.randomUUID()}.webp`,
        webp,
        {
            access: 'private',
            contentType: 'image/webp',
            token: process.env.BLOB_READ_WRITE_TOKEN
        }
    )

    return blob
}
