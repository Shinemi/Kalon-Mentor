'use strict'

const { analyseDrawing } = require('../services/aiService')

beforeEach(() => {
    jest.replaceProperty(process, 'env', { ...process.env, GEMINI_API_KEY: 'cle-fictive-test' })
    jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: '{"resume":"Des ombres cohérentes"}' }] } }] })
    })
})

afterEach(() => jest.restoreAllMocks())

test('transmet une image WebP en base64 et le catalogue au service IA', async () => {
    const image = Buffer.from('image-test')
    const resources = [{ id: 'cours-test', title: 'Les ombres' }]
    await expect(analyseDrawing(image, resources)).resolves.toEqual({ resume: 'Des ombres cohérentes' })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = fetch.mock.calls[0]
    expect(new URL(url).searchParams.get('key')).toBe('cle-fictive-test')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.contents[0].parts[0].text).toContain(JSON.stringify(resources))
    expect(body.contents[0].parts[1].inline_data).toEqual({ mime_type: 'image/webp', data: image.toString('base64') })
    expect(body.generationConfig.responseMimeType).toBe('application/json')
})

test('refuse de contacter Gemini sans clé configurée', async () => {
    delete process.env.GEMINI_API_KEY
    await expect(analyseDrawing(Buffer.from('image'), [])).rejects.toThrow('GEMINI_API_KEY')
    expect(fetch).not.toHaveBeenCalled()
})

test('identifie explicitement une indisponibilité 503', async () => {
    fetch.mockResolvedValue({ ok: false, status: 503 })
    await expect(analyseDrawing(Buffer.from('image'), [])).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
})

test.each([400, 429, 500])('rejette une réponse HTTP %s sans la traiter comme une analyse', async status => {
    const json = jest.fn()
    fetch.mockResolvedValue({ ok: false, status, json })
    await expect(analyseDrawing(Buffer.from('image'), [])).rejects.toThrow(`AI request failed (${status})`)
    expect(json).not.toHaveBeenCalled()
})

test('rejette une réponse sans texte', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) })
    await expect(analyseDrawing(Buffer.from('image'), [])).rejects.toThrow('Empty response')
})

test('retire les balises Markdown entourant un JSON valide', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '```json\n{"resume":"Bien"}\n```' }] } }] }) })
    await expect(analyseDrawing(Buffer.from('image'), [])).resolves.toEqual({ resume: 'Bien' })
})

test('rejette un JSON illisible et les erreurs réseau', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'JSON invalide' }] } }] }) })
    await expect(analyseDrawing(Buffer.from('image'), [])).rejects.toBeInstanceOf(SyntaxError)
    fetch.mockRejectedValueOnce(new Error('réseau indisponible'))
    await expect(analyseDrawing(Buffer.from('image'), [])).rejects.toThrow('réseau indisponible')
})
