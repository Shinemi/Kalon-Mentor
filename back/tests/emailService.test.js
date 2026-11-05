'use strict'

const { sendPasswordResetEmail } = require('../services/emailService')
const originalFetch = global.fetch
const originalEnv = { ...process.env }

beforeEach(() => {
    process.env.BREVO_API_KEY = 'test-key'
    process.env.BREVO_SENDER_EMAIL = 'sender@example.com'
    process.env.BREVO_SENDER_NAME = 'Kalon Mentor'
    process.env.FRONTEND_URL = 'https://kalon-mentor.vercel.app'
    global.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 201 }))
})

afterAll(() => {
    global.fetch = originalFetch
    process.env = originalEnv
})

test('utilise l’API HTTPS, un expéditeur configuré et le domaine front de confiance', async () => {
    await sendPasswordResetEmail('recipient@example.com', 'a'.repeat(64))
    const [url, options] = global.fetch.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(options.headers['api-key']).toBe('test-key')
    const body = JSON.parse(options.body)
    expect(body.to).toEqual([{ email: 'recipient@example.com' }])
    expect(body.sender.email).toBe('sender@example.com')
    expect(body.htmlContent).toContain(`https://kalon-mentor.vercel.app/reset-password#token=${'a'.repeat(64)}`)
    expect(body.htmlContent).not.toContain('test-key')
})

test('ne tente aucun envoi quand la configuration est incomplète', async () => {
    delete process.env.BREVO_API_KEY
    await expect(sendPasswordResetEmail('recipient@example.com', 'token')).rejects.toThrow('Configuration Brevo incomplète.')
    expect(global.fetch).not.toHaveBeenCalled()
})

test('signale un refus du fournisseur sans renvoyer le contenu de sa réponse', async () => {
    global.fetch.mockResolvedValue(new Response('Détails privés', { status: 401 }))
    await expect(sendPasswordResetEmail('recipient@example.com', 'token')).rejects.toThrow('Envoi Brevo refusé (401).')
})
