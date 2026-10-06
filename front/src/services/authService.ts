type Credentials = {
    username?: string
    email: string
    password: string
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

const errorMessages: Record<string, string> = {
    'Invalid email': 'Cette adresse e-mail est invalide.',
    'username, email and password are required': 'Veuillez remplir tous les champs.',
    'email and password are required': 'Veuillez remplir tous les champs.',
    'Password must be at least 8 characters long and contain at least one number and one special character': 'Le mot de passe doit contenir au moins 8 caractères, un chiffre et un caractère spécial.'
}

export const authenticate = async (mode: 'login' | 'register', credentials: Credentials) => {
    let response: Response
    try {
        response = await fetch(`${API_URL}/auth/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        })
    } catch {
        throw new Error('Impossible de joindre le serveur. Réessayez dans un instant.')
    }

    const data = await response.json().catch(() => null)
    if (!response.ok) {
        if (response.status === 401) throw new Error('Adresse e-mail ou mot de passe incorrect.')
        if (response.status === 409) throw new Error('Un compte existe déjà avec cette adresse e-mail.')
        if (response.status === 429) throw new Error('Trop de tentatives. Réessayez plus tard.')
        throw new Error(errorMessages[data?.message] || 'La demande a échoué. Veuillez réessayer.')
    }
    if (typeof data?.token !== 'string' || !data.token) {
        throw new Error('La réponse du serveur est invalide.')
    }
    sessionStorage.setItem('kalon-token', data.token)
}

