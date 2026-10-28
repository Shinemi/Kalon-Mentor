
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { COOKIE_SETTINGS_EVENT, getCookieConsent, saveCookieConsent, startAnalytics } from '../utils/analytics'

import '../styles/components/cookieBanner.scss'

function CookieBanner() {

    const [isOpen, setIsOpen] = useState(() => getCookieConsent() === null)
    const [isCustomizing, setIsCustomizing] = useState(false)
    const [analyticsAccepted, setAnalyticsAccepted] = useState(() => getCookieConsent() === true)

    const bannerRef = useRef<HTMLElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (getCookieConsent() === true) {
            startAnalytics()
        }

        const openSettings = () => {
            previousFocusRef.current = document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null

            setAnalyticsAccepted(getCookieConsent() === true)
            setIsCustomizing(true)
            setIsOpen(true)
        }

        window.addEventListener(
            COOKIE_SETTINGS_EVENT,
            openSettings
        )

        return () => {
            window.removeEventListener(
                COOKIE_SETTINGS_EVENT,
                openSettings
            )
        }
    }, [])

    useEffect(() => {
        if (isOpen) {
            bannerRef.current?.focus()
        }
    }, [isOpen])

    const handleChoice = (accepted: boolean) => {
        saveCookieConsent(accepted)

        setAnalyticsAccepted(accepted)
        setIsCustomizing(false)
        setIsOpen(false)

        requestAnimationFrame(() => {
            previousFocusRef.current?.focus?.()
        })
    }

    if (!isOpen) return null

    return (
        <section
            className="cookieBanner"
            ref={bannerRef}
            tabIndex={-1}
            aria-labelledby="cookieTitle"
            aria-describedby="cookieDescription"
        >
            <h2 id="cookieTitle">Gestion des cookies</h2>
            <p id="cookieDescription">Kalon Mentor vous propose d'autoriser Google Analytics pour mesurer la fréquentation du site et améliorer votre expérience. Ces cookies sont facultatifs : vous pouvez les refuser et modifier votre choix depuis le pied de page.</p>

            {isCustomizing && (
                <div className="cookiePreferences">
                    <div className="cookiePreference">
                        <span>Stockage nécessaire</span>
                        <span>Toujours actif</span>
                    </div>
                    <label className="cookiePreference">
                        <span>Cookies de mesure d'audience</span>
                        <input
                            type="checkbox"
                            checked={analyticsAccepted}
                            onChange={(e) =>
                                setAnalyticsAccepted(e.target.checked)
                            }
                        />
                    </label>
                </div>
            )}

            <div className="cookieActions">
                <button type="button" onClick={() => handleChoice(false)}>Tout refuser</button>
                <button type="button" onClick={() => handleChoice(true)}>Tout accepter</button>

                {isCustomizing ? (
                    <button type="button" onClick={() => handleChoice(analyticsAccepted)}>Enregistrer</button>
                ) : (
                    <button type="button" aria-expanded={isCustomizing} onClick={() => setIsCustomizing(true)}>Personnaliser</button>
                )}
            </div>
            <Link to="/legal#confidentialite">Politique de confidentialité</Link>
        </section>
    )
}

export default CookieBanner
