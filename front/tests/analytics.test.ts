import { beforeEach, expect, it, vi } from 'vitest'

const key = 'kalon_mentor_cookie_consent'

beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    document.head.querySelectorAll('script').forEach(script => script.remove())
    delete window.gtag
    delete window.dataLayer
})

it.each([true, false])('relit un consentement récent : %s', async accepted => {
    localStorage.setItem(key, JSON.stringify({
        accepted,
        date: Date.now()
    }))

    const { getCookieConsent } = await import('../src/utils/analytics')

    expect(getCookieConsent()).toBe(accepted)
})

it.each([Date.now() - 180 * 86400000, Date.now() + 86400000, 'invalide'])('rejette une date invalide ou expirée : %s', async date => {
    localStorage.setItem(key, JSON.stringify({
        accepted: true,
        date
    }))

    const { getCookieConsent } = await import('../src/utils/analytics')

    expect(getCookieConsent()).toBeNull()
    expect(localStorage.getItem(key)).toBeNull()
})

it('tolère un stockage corrompu ou inaccessible', async () => {
    localStorage.setItem(key, '{')

    const { getCookieConsent, saveCookieConsent } = await import('../src/utils/analytics')

    expect(getCookieConsent()).toBeNull()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqué')
    })
    saveCookieConsent(false)

    expect(getCookieConsent()).toBe(false)
})

it('ne charge aucun script sans consentement', async () => {
    const { startAnalytics, trackEvent } = await import('../src/utils/analytics')
    startAnalytics()
    trackEvent('test')

    expect(document.head.querySelector('script')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
})

it('charge une seule fois et attend le chargement avant les événements', async () => {
    const { saveCookieConsent, startAnalytics, trackEvent } = await import('../src/utils/analytics')
    saveCookieConsent(true)
    startAnalytics()

    const scripts = document.head.querySelectorAll('script')

    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123')

    trackEvent('avant')

    expect(window.dataLayer).not.toContainEqual([
        'event',
        'avant',
        {}
    ])

    scripts[0].dispatchEvent(new Event('load'))
    trackEvent('analyse', { source: 'galerie' })

    expect(window.dataLayer).toContainEqual([
        'event',
        'analyse',
        { source: 'galerie' }
    ])
})

it('exclut la page contenant le lien de réinitialisation', async () => {
    window.history.replaceState(null, '', '/reset-password#token=secret')

    const { saveCookieConsent } = await import('../src/utils/analytics')
    saveCookieConsent(true)

    expect(document.head.querySelector('script')).toBeNull()
})

it('ignore un identifiant Google invalide', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'invalide')

    const { saveCookieConsent } = await import('../src/utils/analytics')
    saveCookieConsent(true)

    expect(document.head.querySelector('script')).toBeNull()
})

it('permet de réessayer après une erreur de chargement', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => { })

    const { saveCookieConsent, startAnalytics } = await import('../src/utils/analytics')
    saveCookieConsent(true)
    document.head.querySelector('script')!.dispatchEvent(new Event('error'))

    expect(document.head.querySelector('script')).toBeNull()

    startAnalytics()

    expect(document.head.querySelectorAll('script')).toHaveLength(1)
})

it('émet la demande d’ouverture des préférences', async () => {
    const { openCookieSettings, COOKIE_SETTINGS_EVENT } = await import('../src/utils/analytics')
    const listener = vi.fn()
    window.addEventListener(COOKIE_SETTINGS_EVENT, listener, { once: true })
    openCookieSettings()

    expect(listener).toHaveBeenCalledOnce()
})

it.each(['sign_up', 'analyse_start', 'analyse_success', 'analyse_error', 'course_open', 'analysis_save'] as const)('émet %s seulement après consentement et sans donnée privée', async name => {
    const { trackBusinessEvent, saveCookieConsent } = await import('../src/utils/analytics')
    trackBusinessEvent(name)
    expect(window.dataLayer).toBeUndefined()
    saveCookieConsent(true)
    document.head.querySelector('script')!.dispatchEvent(new Event('load'))
    const unsafe = { category: 'perspective', email: 'secret@example.test', image: 'dessin-privé', error: 'secret@example.test' }
    trackBusinessEvent(name, unsafe)
    const event = (window.dataLayer as unknown[][]).filter(entry => entry[0] === 'event' && entry[1] === name)
    expect(event).toHaveLength(1)
    expect(event[0][2]).toMatchObject({ category: 'perspective' })
    expect(JSON.stringify(event)).not.toContain('secret')
    expect(JSON.stringify(event)).not.toContain('dessin-privé')
})

it('retire query et fragment des pages mesurées et exclut les routes privées inconnues', async () => {
    window.history.replaceState(null, '', '/courses?email=secret#token=secret')
    const { saveCookieConsent, trackPageView } = await import('../src/utils/analytics')
    saveCookieConsent(true)
    document.head.querySelector('script')!.dispatchEvent(new Event('load'))
    trackPageView()
    const events = (window.dataLayer as unknown[][]).filter(entry => entry[0] === 'event' && entry[1] === 'page_view')
    expect(events).toHaveLength(1)
    expect(JSON.stringify(events)).not.toContain('secret')
    expect(events[0][2]).toMatchObject({ page_location: `${window.location.origin}/courses` })
})
