import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserAnalyses } from '../services/AdminService'
import type { UserAnalyses } from '../services/AdminService'

const AdminUserAnalyses = ({ userId }: { userId: string }) => {
    const [analyses, setAnalyses] = useState<UserAnalyses | null>(null)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const loadAnalyses = async () => {
            try {
                const data = await getUserAnalyses(userId, controller.signal)
                if (controller.signal.aborted) return

                if (!data) {
                    navigate('/login', { replace: true })
                    return
                }

                setAnalyses(data)
            } catch (error) {
                if (controller.signal.aborted) return

                setError(error instanceof Error ? error.message : 'Impossible de charger les analyses.')
            }
        }

        loadAnalyses()
        return () => controller.abort()
    }, [userId, navigate])

    if (error) return <p role="alert">{error}</p>
    if (!analyses) return <p role="status">Chargement des analyses…</p>

    return (
        <>
            <p role="status">{analyses.total} analyse(s) réussie(s) enregistrée(s).</p>

            {analyses.dates.length > 0 && (
                <ul>
                    {analyses.dates.map((date, index) => (
                        <li key={`${date}-${index}`}>{new Date(date).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</li>
                    ))}
                </ul>
            )}
        </>
    )
}

export default AdminUserAnalyses