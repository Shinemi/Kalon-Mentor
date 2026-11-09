import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUsers } from '../services/AdminService'
import type { AdminUser } from '../services/AdminService'
import AdminUserAnalyses from './AdminUserAnalyses'

const AdminUsers = () => {
    const [users, setUsers] = useState<AdminUser[] | null>(null)
    const [error, setError] = useState('')
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const loadUsers = async () => {
            try {
                const data = await getAdminUsers(controller.signal)
                if (controller.signal.aborted) return

                if (!data) {
                    navigate('/login', { replace: true })
                    return
                }

                setUsers(data)
            } catch (error) {
                if (controller.signal.aborted) return

                setError(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.')
            }
        }

        loadUsers()
        return () => controller.abort()
    }, [navigate])

    if (error) return <p role="alert">{error}</p>
    if (!users) return <p role="status">Chargement des utilisateurs…</p>
    if (users.length === 0) return <p>Aucun utilisateur à afficher.</p>

    return (
        <>
            <div className="admin-table" role="region" aria-label="Liste des utilisateurs" tabIndex={0}>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Pseudo</th>
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