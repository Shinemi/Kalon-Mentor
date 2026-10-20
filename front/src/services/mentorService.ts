export type AnalysisResult = {
    feedback: Record<string, unknown>
    image: string
}

const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '')

export const analyseImage = async (
    image: File
): Promise<AnalysisResult | null> => {
    const token = sessionStorage.getItem('kalon-token')
    if (!token) return null

    const body = new FormData()
    body.append('image', image)

    let response: Response

    try {
        response = await fetch(`${API_URL}/mentor/correction`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body
        })
    } catch {
        throw new Error('Impossible de joindre le serveur. Veuillez réessayer.')
    }

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        return null
    }

    if (response.status === 429) {
        throw new Error('Trop de demandes. Réessayez dans quelques instants.')
    }

    if (response.status >= 500) {
        throw new Error('L’analyse a échoué. Veuillez réessayer dans un instant.')
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        const validationMessage = data?.invalidParams?.find(
            (param: { message?: unknown }) =>
                typeof param?.message === 'string'
        )?.message

        throw new Error(
            validationMessage ||
            data?.title ||
            'Impossible d’analyser le dessin.'
        )
    }

    if (
        !data?.feedback ||
        typeof data.feedback !== 'object' ||
        Array.isArray(data.feedback) ||
        typeof data.image !== 'string' ||
        !data.image
    ) {
        throw new Error('La réponse du serveur est invalide.')
    }

    return {
        feedback: data.feedback,
        image: data.image
    }
}