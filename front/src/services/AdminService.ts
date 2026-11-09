const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

export const checkAdminAccess = async (signal: AbortSignal): Promise<boolean> => {
    const token = sessionStorage.getItem('kalon-token')
    if (!token) return false

    const response = await fetch(`${API_URL}/admin/access`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
    }).catch(() => {
        throw new Error('Impossible de joindre le serveur. Réessayez plus tard.')
    })

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        return false
    }

    if (response.status === 403) {
        throw new Error('Accès réservé aux administrateurs.')
    }

    if (!response.ok) {
        throw new Error('Impossible de vérifier votre accès. Réessayez plus tard.')
    }

    return true
}

export type AdminUser = {
    id: string
    username: string
    email: string
    role: 'member' | 'admin'
    created_at: string
}

export const getAdminUsers = async (signal: AbortSignal): Promise<AdminUser[] | null> => {
    const token = sessionStorage.getItem('kalon-token')
    if (!token) return null

    const response = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
    }).catch(() => {
        throw new Error('Impossible de joindre le serveur. Réessayez plus tard.')
    })

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        return null
    }

    if (response.status === 403) {
        throw new Error('Accès réservé aux administrateurs.')
    }

    if (!response.ok) throw new Error('Impossible de charger les utilisateurs.')

    const data = await response.json().catch(() => null)
    if (!Array.isArray(data?.users)) throw new Error('La réponse du serveur est invalide.')

    return data.users
}

export type AdminAiStatus = {
    quotaAvailable: boolean
    quota: number | null
    message: string
}

export const getAdminAiStatus = async (signal: AbortSignal): Promise<AdminAiStatus | null> => {
    const token = sessionStorage.getItem('kalon-token')
    if (!token) return null

    const response = await fetch(`${API_URL}/admin/ai/status`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
    }).catch(() => {
        throw new Error('Impossible de joindre le serveur. Réessayez plus tard.')
    })

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        return null
    }

    if (response.status === 403) {
        throw new Error('Accès réservé aux administrateurs.')
    }

    if (!response.ok) throw new Error('Impossible de charger les données IA.')

    const data = await response.json().catch(() => null)

    if (
        typeof data?.quotaAvailable !== 'boolean' ||
        typeof data?.message !== 'string' ||
        (data.quota !== null && typeof data.quota !== 'number')
    ) {
        throw new Error('La réponse du serveur est invalide.')
    }

    return data
}