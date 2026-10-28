
const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()
const CONSENT_KEY = 'kalon_mentor_cookie_consent'
const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000

export const COOKIE_SETTINGS_EVENT = 'kalon-mentor-open-cookie-settings'

type AnalyticsParameters = Record<string, unknown>
type GtagArguments =
    | ['consent', 'default' | 'update', AnalyticsParameters]
    | ['js', Date]
    | ['config', string, AnalyticsParameters?]
    | ['event', string, AnalyticsParameters]

declare global {
    interface Window {
        dataLayer?: unknown[]
        gtag?: (...args: GtagArguments) => void
        [key: `ga-disable-${string}`]: boolean | undefined
    }
}

export const openCookieSettings = (): void => {
    window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
}

let analyticsStarted = false
let sessionConsent: boolean | null = null

export const getCookieConsent = (): boolean | null => {
    if (sessionConsent !== null) return sessionConsent

    try {
        const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null')

        if (!saved || typeof saved.accepted !== 'boolean') {
            return sessionConsent
        }

        if (
            typeof saved.date !== 'number' ||
            !Number.isFinite(saved.date) ||
            saved.date > Date.now() ||
            Date.now() - saved.date >= CONSENT_DURATION
        ) {
            localStorage.removeItem(CONSENT_KEY)
            return null
        }

        return saved.accepted
    } catch {
        return sessionConsent
    }
}

let analyticsLoading = false

export const startAnalytics = () => {
    if (getCookieConsent() === true && GA_ID) {
        window[`ga-disable-${GA_ID}`] = false
        if (analyticsStarted || analyticsLoading) {
            window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
        }
    }

    if (
        analyticsStarted ||
        analyticsLoading ||
        !/^G-[A-Z0-9]+$/.test(GA_ID) ||
        getCookieConsent() !== true
    ) return

    analyticsLoading = true

    window.dataLayer = window.dataLayer || []

    window[`ga-disable-${GA_ID}`] = false
    window.gtag = (...args: GtagArguments) => {
        window.dataLayer?.push(args)
    }

    window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    })

    window.gtag('consent', 'update', {
        analytics_storage: 'granted'
    })

    window.gtag('js', new Date())

    window.gtag('config', GA_ID, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    })

    const script = document.createElement('script')

    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`

    script.onload = () => {
        analyticsStarted = true
        analyticsLoading = false
    }

    script.onerror = () => {
        analyticsLoading = false
        console.error('Erreur de chargement Google Analytics')
        script.remove()
    }

    document.head.appendChild(script)
}

const deleteAnalyticsCookies = () => {
    const names = document.cookie
        .split(';')
        .map(cookie => cookie.split('=')[0].trim())
        .filter(name =>
            name === '_ga' ||
            name.startsWith('_ga_')
        )

    const hostname = window.location.hostname
    const parts = hostname.split('.')

    const domains = ['', hostname, `.${hostname}`]

    // Cas d'un domaine personnalisé avec sous-domaines
    if (parts.length > 2) {
        domains.push(`.${parts.slice(1).join('.')}`)
    }

    names.forEach(name => {
        domains.forEach(domain => {
            const domainAttribute = domain
                ? `; domain=${domain}`
                : ''

            document.cookie =
                `${name}=; Max-Age=0; path=/${domainAttribute}`
        })
    })
}

export const saveCookieConsent = (accepted: boolean): boolean => {
    const wasEnabled = analyticsStarted || analyticsLoading
    let persisted = false

    sessionConsent = accepted
    try {
        localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({ accepted, date: Date.now() })
        )
        persisted = true
    } catch {
        // Le choix reste valable en mémoire si le navigateur bloque le stockage.
    }

    if (accepted) {
        startAnalytics()
    } else {
        window[`ga-disable-${GA_ID}`] = true
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: 'denied'
            })
        }

        deleteAnalyticsCookies()

        if (wasEnabled && persisted) {
            window.location.reload()
        }
    }

    return accepted
}

export const trackEvent = (name: string, params: AnalyticsParameters = {}): void => {
    if (
        getCookieConsent() !== true ||
        !analyticsStarted ||
        typeof window.gtag !== 'function'
    ) return

    window.gtag('event', name, params)
}
