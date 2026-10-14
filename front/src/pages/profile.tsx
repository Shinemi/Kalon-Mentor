import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getProfile } from '../services/authService'
import type { UserProfile } from '../services/authService'
import { CircleUser, PencilLine, BookOpen, LogOut } from 'lucide-react'
import '../styles/pages/profile.scss'

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [error, setError] = useState('')
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


    return (
    <main className="profile-page">
        <div className="profile-content">
            <div className="profile-heading">
                <h1>Mon profil</h1>
                <p>Un espace pour cultiver votre coup de crayon.</p>
            </div>

            {error ? ( <p className="profile-error" role="alert">{error}</p> ) : user ? (
                <>
                    <section className="profile-identity" aria-labelledby="profile-name">
                        <div className="profile-avatar"> <CircleUser aria-hidden="true" /> </div>

                        <div>
                            <p className="profile-label"> Votre espace personnel </p>
                            <h2 id="profile-name">{user.username}</h2>
                            <p className="profile-note"> Chaque dessin est un pas de plus. </p>
                        </div>
                    </section>

                    <div className="profile-grid">
                        <section
                            className="profile-card"
                            aria-labelledby="account-title"
                        >
                            <h2 id="account-title"> Informations du compte </h2>
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
                        </section>

                        <section className="profile-card profile-workspace" aria-labelledby="workspace-title">
                            <h2 id="workspace-title"> Votre atelier </h2>

                            <p> Retrouvez les outils pour poursuivre votre apprentissage. </p>

                            <div className="profile-links">
                                <Link to="/mentorship" className="profile-action"><PencilLine aria-hidden="true" />Accéder au mentorat</Link>

                                <Link to="/courses" className="profile-action"><BookOpen aria-hidden="true" />Explorer les cours</Link>
                            </div>
                        </section>
                    </div>

                    <div className="profile-session">
                        <button
                            type="button"
                            className="button-primary"
                            onClick={handleLogout}
                        >
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

