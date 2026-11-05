import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { recoverPassword } from '../services/AuthService'
import '../styles/components/form.scss'

type PasswordRecoveryProps = {
    mode: 'request' | 'reset'
}

const PasswordRecovery = ({ mode }: PasswordRecoveryProps) => {
    const isReset = mode === 'reset'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (isReset && window.location.hash) {
            // Le jeton reste en mémoire, mais disparaît de la barre d'adresse.
            navigate('/reset-password', { replace: true })
        }
    }, [isReset, navigate])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isLoading) return
        setError('')

        if (isReset && password !== confirmation) {
            setError('Les mots de passe ne correspondent pas.')
            return
        }

        setIsLoading(true)

        try {
            const fields = isReset ? { token, password } : { email: email.trim() }
            const message = await recoverPassword(mode, fields)
            setSuccess(message)
            setPassword('')
            setConfirmation('')
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Impossible de joindre le serveur. Réessayez plus tard.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-heading">
                <h1>{isReset ? 'Nouveau mot de passe' : 'Mot de passe oublié ?'}</h1>
                <p>{isReset ? 'Choisissez un nouveau mot de passe pour retrouver votre atelier.' : 'Recevez un lien pour réinitialiser votre mot de passe.'}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} aria-busy={isLoading}>
                {success ? (
                    <p role="status">{success}</p>
                ) : isReset && !/^[a-f0-9]{64}$/.test(token) ? (
                    <p className="form-error" role="alert">Ce lien est invalide. Ouvrez le lien reçu par e-mail ou demandez-en un nouveau.</p>
                ) : (
                    <fieldset disabled={isLoading}>
                        <legend>{isReset ? 'Choisir un nouveau mot de passe' : 'Recevoir un lien par e-mail'}</legend>

                        {isReset ? (
                            <>
                                <div className="form-field">
                                    <label htmlFor="recovery-password">Nouveau mot de passe</label>
                                    <div className="input-content">
                                        <Lock aria-hidden="true" />
                                        <input id="recovery-password" name="password" type="password"
                                            value={password} onChange={event => setPassword(event.target.value)}
                                            autoComplete="new-password" minLength={8} required aria-describedby="recovery-help" />
                                    </div>
                                    <p id="recovery-help">Au moins 8 caractères, un chiffre et un caractère spécial.</p>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="recovery-confirmation">Confirmer le mot de passe</label>
                                    <div className="input-content">
                                        <Lock aria-hidden="true" />
                                        <input id="recovery-confirmation" name="confirmation" type="password"
                                            value={confirmation} onChange={event => setConfirmation(event.target.value)}
                                            autoComplete="new-password" minLength={8} required />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="form-field">
                                <label htmlFor="recovery-email">Adresse e-mail</label>
                                <div className="input-content">
                                    <Mail aria-hidden="true" />
                                    <input id="recovery-email" name="email" type="email"
                                        value={email} onChange={event => setEmail(event.target.value)}
                                        autoComplete="email" required />
                                </div>
                            </div>
                        )}

                        {error && <p className="form-error" role="alert">{error}</p>}
                        <button type="submit" className="button-primary">{isLoading ? 'Veuillez patienter…' : isReset ? 'Modifier mon mot de passe' : 'Recevoir le lien'}</button>
                    </fieldset>
                )}

                {success && !isReset && <p>Vérifiez également vos courriers indésirables. Attendez une minute avant de renouveler une demande.</p>}
                {isReset && <p className="auth-link"><Link to="/forgot-password">Demander un nouveau lien</Link></p>}
                <p className="auth-link"><Link to="/login">Retour à la connexion</Link></p>
            </form>
        </main>
    )
}

export default PasswordRecovery
