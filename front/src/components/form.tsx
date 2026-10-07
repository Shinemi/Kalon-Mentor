import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, Mail, Lock } from 'lucide-react'
import { authenticate } from '../services/authService'
import '../styles/components/form.scss'

type FormProps = {
    mode: 'login' | 'register'
}

const Form = ({ mode }: FormProps) => {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const isRegister = mode === 'register'
    const location = useLocation()
    const image = location.state?.image instanceof File ? location.state.image : null


    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isLoading) return
        setError('')
        if (isRegister && !username.trim()) {
            setError('Veuillez saisir votre pseudo.')
            return
        }

        setIsLoading(true)
        try {
            await authenticate(mode, {
                email: email.trim(),
                password,
                ...(isRegister ? { username: username.trim() } : {})
            })
            navigate(image ? '/mentorship' : '/', {
                replace: true,
                state: {
                    image,
                    message: isRegister
                        ? 'Votre compte a été créé. Bienvenue sur Kalon Mentor !'
                        : 'Vous êtes connecté à Kalon Mentor.'
                }
            })
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Une erreur est survenue.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit} aria-busy={isLoading}>
            <fieldset disabled={isLoading}>
                <legend>{isRegister ? 'Vos informations' : 'Vos identifiants'}</legend>
                {isRegister && (
                    <div className="form-field">
                        <label htmlFor="username">Pseudo</label>
                        <div className="input-content">
                            <User aria-hidden="true" />
                            <input 
                                id="username" 
                                name="username" 
                                type="text" autoComplete="username" 
                                placeholder="Votre pseudo" 
                                required value={username} 
                                onChange={event => setUsername(event.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="form-field">
                    <label htmlFor="email">Adresse e-mail</label>
                    <div className="input-content">
                        <Mail aria-hidden="true" />
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            autoComplete="email" 
                            placeholder="artiste@studio.fr" 
                            required value={email} 
                            onChange={event => setEmail(event.target.value)}
                        />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="password">Mot de passe</label>
                    <div className="input-content">
                        <Lock aria-hidden="true" />
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            autoComplete={isRegister ? 'new-password' : 'current-password'} 
                            placeholder="Votre mot de passe" 
                            minLength={isRegister ? 8 : undefined} 
                            aria-describedby={isRegister ? 'password-help' : undefined} 
                            required value={password} onChange={event => setPassword(event.target.value)} 
                        />
                    </div>
                    {isRegister && <p id="password-help">Au moins 8 caractères, un chiffre et un caractère spécial.</p>}
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="button-primary" type="submit">
                    {isLoading ? 'Veuillez patienter…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
                </button>
            </fieldset>

            <p className="auth-link">
                {isRegister ? 'Vous avez déjà un compte ? ' : 'Pas encore de compte ? '}
                <Link
                    to={isRegister ? '/login' : '/register'}
                    state={{ image }}
                >
                    {isRegister ? 'Connectez-vous' : 'Inscrivez-vous'}
                </Link>
            </p>
        </form>
    )
}

export default Form
