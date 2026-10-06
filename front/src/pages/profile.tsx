import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../services/authService'
import type { UserProfile } from '../services/authService'
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
            <h1>Mon profil</h1>
            {error ? (
                <p role="alert">{error}</p>
            ) : user ? (
                <>
                    {/* description list */}
                    <dl className="profile-information"> 
                        {/* description term */}
                        <dt>Pseudo</dt>
                        {/* description details */}
                        <dd>{user.username}</dd>

                        <dt>Adresse e-mail</dt>
                        <dd>{user.email}</dd>
                    </dl>
                    <button type="button" className="button-primary" onClick={handleLogout}> Se déconnecter </button>
                </>
            ) : (
                <p role="status">Chargement du profil…</p>
            )}
        </main>
    )
}

export default Profile

