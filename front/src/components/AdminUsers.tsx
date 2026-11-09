import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUsers } from '../services/AdminService'
import type { AdminUser } from '../services/AdminService'

const AdminUsers = () => {
    const [users, setUsers] = useState<AdminUser[] | null>(null)
    const [error, setError] = useState('')
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
        <div className="admin-table" role="region" aria-label="Liste des utilisateurs" tabIndex={0}>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Pseudo</th>
                        <th scope="col">E-mail</th>
                        <th scope="col">Rôle</th>
                        <th scope="col">Inscription</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.role === 'admin' ? 'Administrateur' : 'Membre'}</td>
                            <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default AdminUsers