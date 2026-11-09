import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const [token] = useState(() => {
        return new URLSearchParams(window.location.hash.slice(1))
            .get('token') || ''
    })

    const navigate = useNavigate()
    const invalidToken = isReset && !/^[a-f0-9]{64}$/.test(token)

    useEffect(() => {
        if (isReset && window.location.hash) {
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
            const fields = isReset
                ? { token, password }
                : { email: email.trim() }

            const message = await recoverPassword(mode, fields)

            setSuccess(message)
            setPassword('')
            setConfirmation('')
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Impossible de joindre le serveur.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-heading">
                <h1>{isReset ? 'Nouveau mot de passe' : 'Mot de passe oublié ?'}</h1>
                <p>{isReset ? 'Choisissez un nouveau mot de passe.' : 'Recevez un lien pour retrouver votre atelier.'}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} aria-busy={isLoading}>
                {success ? (
                    <p role="status">{success}</p>
                ) : invalidToken ? (
                    <p className="form-error" role="alert">Ce lien est invalide. Ouvrez le lien reçu par e-mail ou demandez-en un nouveau.</p>
                ) : (
                    <fieldset disabled={isLoading}>
                        <legend>{isReset ? 'Nouveau mot de passe' : 'Adresse du compte'}</legend>

                        {isReset ? (
                            <>
                                <div className="form-field">
                                    <label htmlFor="recovery-password">Nouveau mot de passe</label>

                                    <div className="input-content">
                                        <input
                                            id="recovery-password" name="password" type="password"
                                            value={password} onChange={event => setPassword(event.target.value)}
                                            autoComplete="new-password" minLength={8} required
                                            aria-describedby="recovery-help"
                                        />
                                    </div>

                                    <p id="recovery-help">Au moins 8 caractères, un chiffre et un caractère spécial.</p>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="recovery-confirmation">Confirmer le mot de passe</label>

                                    <div className="input-content">
                                        <input
                                            id="recovery-confirmation" name="confirmation" type="password"
                                            value={confirmation} onChange={event => setConfirmation(event.target.value)}
                                            autoComplete="new-password" minLength={8} required
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="form-field">
                                <label htmlFor="recovery-email">Adresse e-mail</label>

                                <div className="input-content">
                                    <input
                                        id="recovery-email" name="email" type="email"
                                        value={email} onChange={event => setEmail(event.target.value)}
                                        autoComplete="email" required
                                    />
                                </div>
                            </div>
                        )}

                        {error && <p className="form-error" role="alert">{error}</p>}

                        <button type="submit" className="button-primary">
                            {isLoading ? 'Veuillez patienter…' : isReset ? 'Modifier mon mot de passe' : 'Recevoir le lien'}
                        </button>
                    </fieldset>
                )}

                {success && !isReset && <p>Vérifiez également vos courriers indésirables.</p>}
                {isReset && <p className="auth-link"><Link to="/forgot-password">Demander un nouveau lien</Link></p>}

                <p className="auth-link"><Link to="/login">Retour à la connexion</Link></p>
            </form>
        </main>
    )
}

export default PasswordRecovery
