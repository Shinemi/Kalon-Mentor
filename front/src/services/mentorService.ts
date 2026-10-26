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


export const saveAnalysis = async (
    result: AnalysisResult
): Promise<number | null> => {
    const token = sessionStorage.getItem('kalon-token')

    if (!token) {
        throw new Error('Connectez-vous pour sauvegarder votre analyse.')
    }

    const response = await fetch(`${API_URL}/mentor/correctionSave`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
    })

    const data = await response.json()

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.')
    }

    if (
        response.status === 403 &&
        typeof data.maxCorrections === 'number'
    ) {
        return data.maxCorrections
    }

    if (!response.ok) {
        throw new Error(
            data.invalidParams?.[0]?.message ||
            data.title ||
            'Impossible de sauvegarder cette analyse.'
        )
    }

    return null
}

export type SavedAnalysis = {
    id: string
    imageUrl: string
    feedback: Record<string, unknown>
    createdAt: string
}

type GalleryResponse = {
    corrections: {
        id: string
        image_url: string
        feedback_text: string | Record<string, unknown>
        created_at: string
    }[]
    maxCorrections: number
}

export const getHistory = async (signal?: AbortSignal) => {
    const token = sessionStorage.getItem('kalon-token')
    if (!token) return null

    const response = await fetch(`${API_URL}/mentor/correctionGallery`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
    })

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        return null
    }

    if (!response.ok) {
        throw new Error('Impossible de charger votre historique.')
    }

    const data: GalleryResponse = await response.json()

    const corrections: SavedAnalysis[] = data.corrections.map(correction => {
        const feedback = typeof correction.feedback_text === 'string'
            ? JSON.parse(correction.feedback_text)
            : correction.feedback_text

        if (!feedback || typeof feedback !== 'object' || Array.isArray(feedback)) {
            throw new Error('Une analyse sauvegardée contient un retour invalide.')
        }

        return {
            id: correction.id,
            imageUrl: new URL(correction.image_url, API_URL).href,
            feedback,
            createdAt: correction.created_at
        }
    })

    return { corrections, maxCorrections: data.maxCorrections }
}

export const deleteAnalysis = async (id: string) => {
    const token = sessionStorage.getItem('kalon-token')
    if (!token) return false

    const response = await fetch(`${API_URL}/mentor/correctionDelete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    })

    if (response.status === 401) {
        sessionStorage.removeItem('kalon-token')
        return false
    }

    if (!response.ok) {
        throw new Error('Impossible de supprimer cette analyse.')
    }

    return true
}