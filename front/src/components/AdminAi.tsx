import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminAiStatus } from '../services/AdminService'
import type { AdminAiStatus } from '../services/AdminService'

const AdminAi = () => {
    const [status, setStatus] = useState<AdminAiStatus | null>(null)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const loadStatus = async () => {
            try {
                const data = await getAdminAiStatus(controller.signal)
                if (controller.signal.aborted) return

                if (!data) {
                    navigate('/login', { replace: true })
                    return
                }

                setStatus(data)
            } catch (error) {
                if (controller.signal.aborted) return

                setError(error instanceof Error ? error.message : 'Impossible de charger les données IA.')
            }
        }

        loadStatus()
        return () => controller.abort()
    }, [navigate])

    if (error) return <p role="alert">{error}</p>
    if (!status) return <p role="status">Chargement des données IA…</p>

    return (
        <dl>
            <dt>Quota Gemini</dt>
            <dd>{status.quotaAvailable ? status.quota : status.message}</dd>
        </dl>
    )
}

export default AdminAi