import { beforeEach, expect, it, vi } from 'vitest'
import { analyseImage, saveAnalysis, getHistory } from '../src/services/MentorService'
import { trackBusinessEvent } from '../src/utils/analytics'

vi.mock('../src/utils/analytics', () => ({ trackBusinessEvent: vi.fn() }))

const result = { feedback: { resume: 'Analyse' }, image: 'aW1hZ2U=' }
const file = new File(['image'], 'dessin.png', { type: 'image/png' })

beforeEach(() => {
    vi.mocked(trackBusinessEvent).mockReset()
    sessionStorage.setItem('kalon-token', 'session-test')
    vi.stubGlobal('fetch', vi.fn())
})

it('ne lance pas de requête sans session', async () => {
    sessionStorage.clear()
    expect(await analyseImage(file)).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    expect(trackBusinessEvent).not.toHaveBeenCalled()
})

it('déclenche le début admis et la réussite une fois après confirmation serveur', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(result), { headers: { 'X-Analysis-Accepted': 'true' } }))
    expect(await analyseImage(file)).toEqual(result)
    expect(trackBusinessEvent).toHaveBeenNthCalledWith(1, 'analyse_start')
    expect(trackBusinessEvent).toHaveBeenNthCalledWith(2, 'analyse_success')
    expect(trackBusinessEvent).toHaveBeenCalledTimes(2)
    const options = vi.mocked(fetch).mock.calls[0][1]!
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.signal).toBeInstanceOf(AbortSignal)
})

it.each([409, 429, 503, 504])('affiche un refus serveur %s sans appel automatique supplémentaire', async status => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ title: 'Quota ou délai atteint' }), { status }))
    await expect(analyseImage(file)).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(trackBusinessEvent).not.toHaveBeenCalledWith('analyse_start')
    expect(trackBusinessEvent).not.toHaveBeenCalledWith('analyse_success')
})

it('mesure la sauvegarde uniquement après confirmation, jamais pour une galerie pleine', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ maxCorrections: 10 }), { status: 403 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ correction: { id: 'id' } }), { status: 201 }))
    expect(await saveAnalysis(result)).toBe(10)
    expect(trackBusinessEvent).not.toHaveBeenCalled()
    expect(await saveAnalysis(result)).toBeNull()
    expect(trackBusinessEvent).toHaveBeenCalledExactlyOnceWith('analysis_save')
})

it('masque le contenu d’un retour JSON illisible dans le message de galerie', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
        corrections: [{ id: 'id', feedback_text: 'contenu-prive-corrompu', image: '', created_at: 'date' }], maxCorrections: 10
    })))
    await expect(getHistory()).rejects.toThrow('Une analyse sauvegardée contient un retour invalide.')
})

it('masque une réponse serveur illisible dans le message de galerie', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('contenu-technique-interne'))
    await expect(getHistory()).rejects.toThrow('La réponse de l’historique est invalide.')
})
