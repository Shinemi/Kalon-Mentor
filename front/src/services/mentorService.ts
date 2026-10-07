export type AnalysisResult = {
    feedback: Record<string, unknown>
    image: string
}

const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '')

export const analyseImage = async (image: File): Promise<AnalysisResult> => {
    const token = sessionStorage.getItem('kalon-token')

    if (!token) {
        throw new Error('Connectez-vous pour analyser votre dessin.')
    }

    const body = new FormData()
    body.append('image', image)

    const response = await fetch(`${API_URL}/mentor/correction`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body
    })

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        throw new Error('Votre session a expiré. Reconnectez-vous.')
    }

    if (response.status === 429) {
        throw new Error('Trop de demandes. Réessayez dans quelques instants.')
    }

    if (!response.ok) {
        throw new Error('Impossible d’analyser le dessin. Réessayez.')
    }

    const data = await response.json()

    if (
        !data.feedback ||
        typeof data.feedback !== 'object' ||
        Array.isArray(data.feedback) ||
        typeof data.image !== 'string'
    ) {
        throw new Error('La réponse du serveur est invalide.')
    }

    return data
}