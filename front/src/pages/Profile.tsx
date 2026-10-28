import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getProfile, updateProfile } from '../services/AuthService'
import type { UserProfile } from '../services/AuthService'
import { CircleUser, PencilLine, BookOpen, LogOut } from 'lucide-react'
import '../styles/pages/profile.scss'

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [error, setError] = useState('')
    const [editing, setEditing] = useState<'information' | 'password' | null>(null)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const loadProfile = async () => {
            try {
                const profile = await getProfile(controller.signal)
                if (controller.signal.aborted) return

                if (!profile) {
                    navigate('/login', { replace: true })
                    return
                }
                setUser(profile)
            } catch {
                if (!controller.signal.aborted) {
                    setError('Impossible de charger votre profil. Veuillez réessayer plus tard.')
                }
            }
        }

        loadProfile()
        return () => controller.abort()
    }, [navigate])

    const handleLogout = () => {
        sessionStorage.removeItem('kalon-token')
        navigate('/login', { replace: true })
    }

    const openEditor = (mode: 'information' | 'password') => {
    setEditing(mode)
    setFormError('')
    setSuccessMessage('')
    }

    const closeEditor = () => {
        setEditing(null)
        setFormError('')
    }

    const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!editing || saving) return

        setFormError('')
        setSuccessMessage('')

        const formData = new FormData(event.currentTarget)

        if (editing === 'password') {
            const password = String(formData.get('password') ?? '')
            const confirmation = String(formData.get('confirmation') ?? '')

            if (password !== confirmation) {
                setFormError('Les mots de passe ne correspondent pas.')
                return
            }
        }

        const fields = editing === 'information'
            ? {
                username: String(formData.get('username') ?? ''),
                email: String(formData.get('email') ?? '')
            }
            : {
                password: String(formData.get('password') ?? '')
            }

        setSaving(true)

        try {
            const updatedUser = await updateProfile(fields)

            if (!updatedUser) {
                navigate('/login', { replace: true })
                return
            }

            setUser(updatedUser)
            setSuccessMessage(
                editing === 'information'
                    ? 'Vos informations ont été modifiées.'
                    : 'Votre mot de passe a été modifié.'
            )
            setEditing(null)
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : 'Impossible de joindre le serveur. Veuillez réessayer.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="profile-page">
            <div className="profile-content">
                <div className="profile-heading">
                    <h1>Mon profil</h1>
                    <p>Un espace pour cultiver votre coup de crayon.</p>
                </div>

                {error ? (
                    <p className="profile-error" role="alert">{error}</p>
                ) : user ? (
                    <>
                        <section className="profile-identity" aria-labelledby="profile-name">
                            <div className="profile-avatar">
                                <CircleUser aria-hidden="true" />
                            </div>

                            <div>
                                <p className="profile-label">Votre espace personnel</p>
                                <h2 id="profile-name">{user.username}</h2>
                                <p className="profile-note">Chaque dessin est un pas de plus.</p>
                            </div>
                        </section>

                        <div className="profile-grid">
                            <section className="profile-card" aria-labelledby="account-title">
                                <h2 id="account-title">Informations du compte</h2>

                                <dl className="profile-information">
                                    <div>
                                        <dt>Pseudo</dt>
                                        <dd>{user.username}</dd>
                                    </div>

                                    <div>
                                        <dt>Adresse e-mail</dt>
                                        <dd>{user.email}</dd>
                                    </div>
                                </dl>

                                {successMessage && (
                                    <p className="profile-success" role="status">{successMessage}</p>
                                )}

                                <div className="profile-edit-buttons">
                                    <button
                                        type="button"
                                        className="profile-action"
                                        onClick={() => openEditor('information')}
                                        disabled={saving}
                                        aria-expanded={editing === 'information'}
                                    >
                                        Modifier mes informations
                                    </button>

                                    <button
                                        type="button"
                                        className="profile-action"
                                        onClick={() => openEditor('password')}
                                        disabled={saving}
                                        aria-expanded={editing === 'password'}
                                    >
                                        Modifier mon mot de passe
                                    </button>
                                </div>

                                {editing && (
                                    <form
                                        key={editing}
                                        className="profile-form"
                                        onSubmit={handleUpdate}
                                        aria-labelledby="profile-form-title"
                                    >
                                        <h3 id="profile-form-title">
                                            {editing === 'information'
                                                ? 'Modifier mes informations'
                                                : 'Modifier mon mot de passe'}
                                        </h3>

                                        <fieldset disabled={saving}>
                                            {editing === 'information' ? (
                                                <>
                                                    <label htmlFor="profile-username">Pseudo</label>
                                                    <input
                                                        id="profile-username"
                                                        name="username"
                                                        type="text"
                                                        defaultValue={user.username}
                                                        autoComplete="username"
                                                        minLength={2}
                                                        maxLength={50}
                                                        required
                                                    />

                                                    <label htmlFor="profile-email">Adresse e-mail</label>
                                                    <input
                                                        id="profile-email"
                                                        name="email"
                                                        type="email"
                                                        defaultValue={user.email}
                                                        autoComplete="email"
                                                        required
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <label htmlFor="profile-password">Nouveau mot de passe</label>
                                                    <input
                                                        id="profile-password"
                                                        name="password"
                                                        type="password"
                                                        autoComplete="new-password"
                                                        aria-describedby="profile-password-help"
                                                        minLength={8}
                                                        required
                                                    />

                                                    <p id="profile-password-help" className="profile-form-help">Au moins 8 caractères, un chiffre et un caractère spécial.</p>

                                                    <label htmlFor="profile-confirmation">Confirmer le nouveau mot de passe</label>
                                                    <input
                                                        id="profile-confirmation"
                                                        name="confirmation"
                                                        type="password"
                                                        autoComplete="new-password"
                                                        minLength={8}
                                                        required
                                                    />
                                                </>
                                            )}

                                            <div className="profile-form-buttons">
                                                <button type="submit" className="button-primary">
                                                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                                                </button>

                                                <button type="button" className="profile-action" onClick={closeEditor}>
                                                    Annuler
                                                </button>
                                            </div>
                                        </fieldset>

                                        {formError && (
                                            <p className="profile-error" role="alert">{formError}</p>
                                        )}
                                    </form>
                                )}
                            </section>

                            <section className="profile-card profile-workspace" aria-labelledby="workspace-title">
                                <h2 id="workspace-title">Votre atelier</h2>

                                <p>Retrouvez les outils pour poursuivre votre apprentissage.</p>

                                <div className="profile-links">
                                    <Link to="/mentorship" className="profile-action">
                                        <PencilLine aria-hidden="true" />
                                        Accéder au mentorat
                                    </Link>

                                    <Link to="/courses" className="profile-action">
                                        <BookOpen aria-hidden="true" />
                                        Explorer les cours
                                    </Link>
                                </div>
                            </section>
                        </div>

                        <div className="profile-session">
                            <button type="button" className="button-primary" onClick={handleLogout}>
                                <LogOut aria-hidden="true" />
                                Se déconnecter
                            </button>
                        </div>
                    </>
                ) : (
                    <p role="status">Chargement du profil…</p>
                )}
            </div>
        </main>
    )
}

export default Profile

