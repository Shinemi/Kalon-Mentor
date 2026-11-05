'use strict'
jest.mock('../models/userModel', () => ({ findUserByEmail: jest.fn(), savePasswordResetToken: jest.fn(), clearPasswordResetToken: jest.fn(), resetPassword: jest.fn() }))
jest.mock('../models/correctionModel', () => ({}))
jest.mock('../services/emailService', () => ({ sendPasswordResetEmail: jest.fn() }))
jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn().mockResolvedValue() }))
const crypto = require('node:crypto')
const bcrypt = require('bcryptjs')
const users = require('../models/userModel')
const { sendPasswordResetEmail } = require('../services/emailService')
const { forgotPassword, resetPassword } = require('../controllers/authController')
function response() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}
beforeEach(() => jest.clearAllMocks())
test('la demande ne révèle pas si un compte existe', async () => {
  users.findUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 7, email: 'artiste@example.com' })
  users.savePasswordResetToken.mockResolvedValue(true)
  const absent = response(); const present = response()
  await forgotPassword({ body: { email: 'absent@example.com' } }, absent)
  await forgotPassword({ body: { email: 'artiste@example.com' } }, present)
  expect(absent.status).toHaveBeenCalledWith(202)
  expect(present.status).toHaveBeenCalledWith(202)
  expect(absent.json.mock.calls[0]).toEqual(present.json.mock.calls[0])
  const [email, token] = sendPasswordResetEmail.mock.calls[0]
  expect(email).toBe('artiste@example.com')
  expect(token).toMatch(/^[a-f0-9]{64}$/)
  expect(users.savePasswordResetToken).toHaveBeenCalledWith(7, crypto.createHash('sha256').update(token).digest('hex'))
})
test('invalide le lien si l’envoi du mail échoue', async () => {
  users.findUserByEmail.mockResolvedValue({ id: 7, email: 'artiste@example.com' })
  users.savePasswordResetToken.mockResolvedValue(true)
  sendPasswordResetEmail.mockRejectedValueOnce(new Error('Brevo indisponible'))
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const res = response()
    await forgotPassword({ body: { email: 'artiste@example.com' } }, res)
    expect(users.clearPasswordResetToken).toHaveBeenCalledWith(7, expect.stringMatching(/^[a-f0-9]{64}$/))
    expect(res.status).toHaveBeenCalledWith(202)
  } finally { log.mockRestore() }
})
test('n’envoie rien lorsque la demande est trop récente', async () => {
  users.findUserByEmail.mockResolvedValue({ id: 7, email: 'artiste@example.com' })
  users.savePasswordResetToken.mockResolvedValue(false)
  await forgotPassword({ body: { email: 'artiste@example.com' } }, response())
  expect(sendPasswordResetEmail).not.toHaveBeenCalled()
})
test.each([true, false])('réinitialise seulement un lien encore valide : %s', async valid => {
  users.resetPassword.mockResolvedValue(valid ? { id: 7 } : null)
  const res = response()
  const token = 'ab'.repeat(32)
  await resetPassword({ body: { token, password: 'dessin123!' } }, res)
  const [tokenHash, passwordHash] = users.resetPassword.mock.calls[0]
  expect(tokenHash).toBe(crypto.createHash('sha256').update(token).digest('hex'))
  expect(await bcrypt.compare('dessin123!', passwordHash)).toBe(true)
  if (valid) expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) })
  else expect(res.status).toHaveBeenCalledWith(400)
})
