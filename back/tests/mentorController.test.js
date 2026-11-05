'use strict'
jest.mock('../models/userModel', () => ({ findUserById: jest.fn() }))
jest.mock('../models/correctionModel', () => ({ countCorrectionsByUser: jest.fn(), createSaveCorrection: jest.fn(), findCorrectionsByUser: jest.fn(), deleteCorrection: jest.fn() }))
jest.mock('../models/resourceModel', () => ({ resourceExists: jest.fn() }))
jest.mock('../services/imageStorage', () => ({ saveImage: jest.fn() }))
jest.mock('../services/aiService', () => ({ analyseDrawing: jest.fn() }))
jest.mock('@vercel/blob', () => ({ get: jest.fn(), del: jest.fn() }))
const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')
const users = require('../models/userModel')
const corrections = require('../models/correctionModel')
const storage = require('../services/imageStorage')
const blob = require('@vercel/blob')
let token
const payload = { image: Buffer.from('dessin').toString('base64'), feedback: { resume: 'Travaillez les ombres', score_global: 65, ressources_recommandees: [] } }
beforeEach(() => {
  jest.resetAllMocks()
  process.env.JWT_SECRET = 'secret-exclusivement-pour-les-tests'
  token = jwt.sign({ id: 1 }, process.env.JWT_SECRET)
  users.findUserById.mockResolvedValue({ id: 1 })
  corrections.countCorrectionsByUser.mockResolvedValue(0)
})
function auth(req) { return req.set('Authorization', `Bearer ${token}`) }
test('refuse une analyse sans token', async () => {
  expect((await request(app).post('/api/v1/mentor/correction')).status).toBe(401)
})
test('refuse une analyse sans image', async () => {
  expect((await auth(request(app).post('/api/v1/mentor/correction'))).status).toBe(400)
})
test('refuse un fichier texte', async () => {
  expect((await auth(request(app).post('/api/v1/mentor/correction')).attach('image', Buffer.from('texte'), 'notes.txt')).status).toBe(400)
})
test('renvoie une galerie vide et ses limites', async () => {
  corrections.findCorrectionsByUser.mockResolvedValue([])
  const response = await auth(request(app).get('/api/v1/mentor/correctionGallery'))
  expect(response.status).toBe(200)
  expect(response.body).toEqual({ corrections: [], savedCount: 0, maxCorrections: 10 })
  expect(response.headers['cache-control']).toBe('private, no-store')
})
test('sauvegarde une correction pour la personne connectée', async () => {
  storage.saveImage.mockResolvedValue({ url: 'https://blob.test/dessin' })
  corrections.createSaveCorrection.mockResolvedValue({ id: 1, image_url: 'https://blob.test/dessin' })
  const response = await auth(request(app).post('/api/v1/mentor/correctionSave')).send(payload)
  expect(response.status).toBe(201)
  expect(storage.saveImage).toHaveBeenCalledWith(Buffer.from('dessin'), 1)
  expect(corrections.createSaveCorrection).toHaveBeenCalledWith(1, 'https://blob.test/dessin', JSON.stringify(payload.feedback), [])
})
test('refuse de dépasser dix corrections sans envoyer de fichier', async () => {
  corrections.countCorrectionsByUser.mockResolvedValue(10)
  const response = await auth(request(app).post('/api/v1/mentor/correctionSave')).send(payload)
  expect(response.status).toBe(403)
  expect(storage.saveImage).not.toHaveBeenCalled()
})
test.each([{ image: payload.image }, { feedback: payload.feedback }, { ...payload, image: 'invalide!' }])('refuse un corps invalide : %j', async body => {
  expect((await auth(request(app).post('/api/v1/mentor/correctionSave')).send(body)).status).toBe(422)
  expect(storage.saveImage).not.toHaveBeenCalled()
})
test.each([true, false])('supprime uniquement une correction appartenant au compte : %s', async exists => {
  corrections.deleteCorrection.mockResolvedValue(exists ? { image_url: 'https://blob.test/dessin' } : null)
  const response = await auth(request(app).delete('/api/v1/mentor/correctionDelete/7'))
  expect(response.status).toBe(exists ? 200 : 404)
  expect(corrections.deleteCorrection).toHaveBeenCalledWith('7', 1)
  if (exists) expect(blob.del).toHaveBeenCalledWith('https://blob.test/dessin', expect.any(Object))
  else expect(blob.del).not.toHaveBeenCalled()
})
