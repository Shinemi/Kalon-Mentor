import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { checkAdminAccess } from '../services/AdminService'
import AdminUsers from '../components/AdminUsers'
import AdminAi from '../components/AdminAi'
import AdminCourses from '../components/AdminCourses'
import '../styles/pages/admin.scss'

type AdminProps = {
    view: 'users' | 'ai' | 'courses'
}

const Admin = ({ view }: AdminProps) => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const verifyAccess = async () => {
            try {
                const allowed = await checkAdminAccess(controller.signal)
                if (controller.signal.aborted) return

                if (!allowed) {
                    navigate('/login', { replace: true })
                    return
                }

                setIsAdmin(true)
            } catch (error) {
                if (controller.signal.aborted) return

                setError(
                    error instanceof Error
                        ? error.message
                        : 'Impossible de vérifier votre accès.'
                )
            }
        }

        verifyAccess()

        return () => controller.abort()
    }, [navigate])

    if (error) {
        return (
            <main className="admin-page">
                <h1>Administration</h1>
                <p role="alert">{error}</p>
            </main>
        )
    }

    if (!isAdmin) {
        return (
            <main className="admin-page">
                <p role="status">Vérification de votre accès…</p>
            </main>
        )
    }

    return (
        <main className="admin-page">
            <nav aria-label="Administration">
                <ul>
                    <li><NavLink to="/klmt/users">Utilisateurs</NavLink></li>
                    <li><NavLink to="/klmt/ai">Données IA</NavLink></li>
                    <li><NavLink to="/klmt/courses">Cours</NavLink></li>
                </ul>
            </nav>

            {view === 'users' && (
                <section>
                    <h1>Gestion des utilisateurs</h1>
                    <AdminUsers />
                </section>
            )}

            {view === 'ai' && (
                <section>
                    <h1>Données IA</h1>
                    <AdminAi />
                </section>
            )}

            {view === 'courses' && (
                <section>
                    <h1>Gestion des cours</h1>
                    <AdminCourses />
                </section>
            )}
        </main>
    )
}

export default Admin