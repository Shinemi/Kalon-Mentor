import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUsers } from '../services/AdminService'
import type { AdminUser } from '../services/AdminService'
import AdminUserAnalyses from './AdminUserAnalyses'

const AdminUsers = () => {
    const [users, setUsers] = useState<AdminUser[] | null>(null)
    const [error, setError] = useState('')
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [page, setPage] = useState(1)
    const [hasNext, setHasNext] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const loadUsers = async () => {
            setLoading(true)
            try {
                const data = await getAdminUsers(controller.signal, page)
                if (controller.signal.aborted) return

                if (!data) {
                    navigate('/login', { replace: true })
                    return
                }

                setUsers(data.users)
                setHasNext(data.hasNext)
                setSelectedUser(null)
            } catch (error) {
                if (controller.signal.aborted) return

                setError(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.')
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadUsers()
        return () => controller.abort()
    }, [navigate, page])

    if (error) return <p role="alert">{error}</p>
    if (!users) return <p role="status">Chargement des utilisateurs…</p>

    return (
        <>
            {users.length === 0 && <p>Aucun utilisateur à afficher sur cette page.</p>}
            <div className="admin-table" role="region" aria-label="Liste des utilisateurs" aria-busy={loading} tabIndex={0}>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Pseudo</th>
                            <th scope="col">Identifiant</th>
                            <th scope="col">E-mail</th>
                            <th scope="col">Rôle</th>
                            <th scope="col">Inscription</th>
                            <th scope="col">Analyses</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.id}</td>
                                <td>{user.email}</td>
                                <td>{user.role === 'admin' ? 'Administrateur' : 'Membre'}</td>
                                <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <button
                                        type="button"
                                        className="button-accent"
                                        aria-label={`Voir les analyses de ${user.username}`}
                                        aria-expanded={selectedUser?.id === user.id}
                                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                                    >
                                        Voir les analyses
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <nav aria-label="Pagination des utilisateurs">
                <button type="button" disabled={page === 1 || loading} onClick={() => setPage(current => current - 1)}>Page précédente</button>
                <span role="status">Page {page}</span>
                <button type="button" disabled={!hasNext || loading} onClick={() => setPage(current => current + 1)}>Page suivante</button>
            </nav>

            {selectedUser && (
                <section id="user-analyses" aria-labelledby="user-analyses-title">
                    <h2 id="user-analyses-title">Réussites de {selectedUser.username}</h2>
                    <p>Ce suivi concerne les réussites enregistrées depuis sa mise en place.</p>
                    <AdminUserAnalyses key={selectedUser.id} userId={selectedUser.id} />
                </section>
            )}
        </>
    )
}

export default AdminUsers
