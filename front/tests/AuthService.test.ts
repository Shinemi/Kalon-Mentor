import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticate, recoverPassword, getProfile, updateProfile, deleteAccount } from '../src/services/AuthService'

const fetchMock = vi.fn()
const user = {
    id: 1,
    username: 'artiste',
    email: 'artiste@example.com'
}
const credentials = {
    email: user.email,
    password: 'dessin123!'
}

function respond(status: number, data: unknown) {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(data), { status }))
}

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset()
})

describe('authentification', () => {
    it.each(['login', 'register'] as const)('envoie les identifiants et conserve le token : %s', async mode => {
        respond(200, { token: 'session' })
        await authenticate(mode, credentials)

        expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`/auth/${mode}$`)), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        })
        expect(sessionStorage.getItem('kalon-token')).toBe('session')
    })
    it.each([[401, 'Adresse e-mail ou mot de passe incorrect.'], [409, 'Un compte existe déjà avec cette adresse e-mail.'], [429, 'Trop de tentatives. Réessayez plus tard.']])('traduit le statut %s', async (status, message) => {
        respond(Number(status), {})

        await expect(authenticate('login', credentials)).rejects.toThrow(String(message))
        expect(sessionStorage.getItem('kalon-token')).toBeNull()
    })
    it.each([
        {},
        { token: '' },
        { token: 42 }
    ])('refuse une réponse sans token valide : %j', async data => {
        respond(200, data)

        await expect(authenticate('login', credentials)).rejects.toThrow('La réponse du serveur est invalide.')
    })
    it('présente les erreurs de validation', async () => {
        respond(422, { invalidParams: [{ message: 'Acceptez les conditions.' }] })

        await expect(authenticate('register', credentials)).rejects.toThrow('Acceptez les conditions.')
    })
    it('gère une panne réseau', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

        await expect(authenticate('login', credentials)).rejects.toThrow('Impossible de joindre le serveur.')
    })
})

describe('récupération du mot de passe', () => {
    it.each(['request', 'reset'] as const)('utilise la route adaptée : %s', async mode => {
        sessionStorage.setItem('kalon-token', 'ancien')

        const fields = mode === 'request' ? { email: user.email } : {
            token: 'a'.repeat(64),
            password: credentials.password
        }
        respond(200, { message: 'Demande traitée' })

        await expect(recoverPassword(mode, fields)).resolves.toBe('Demande traitée')
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(mode === 'request' ? '/forgotPassword' : '/resetPassword'), expect.objectContaining({ body: JSON.stringify(fields) }))
        expect(sessionStorage.getItem('kalon-token')).toBe(mode === 'reset' ? null : 'ancien')
    })
    it('conserve la session si la réinitialisation échoue', async () => {
        sessionStorage.setItem('kalon-token', 'ancien')
        respond(400, {
            title: 'Erreur',
            invalidParams: [{ message: 'Lien expiré' }]
        })

        await expect(recoverPassword('reset', {})).rejects.toThrow('Lien expiré')
        expect(sessionStorage.getItem('kalon-token')).toBe('ancien')
    })
    it('refuse un succès sans message', async () => {
        respond(200, {})

        await expect(recoverPassword('request', {})).rejects.toThrow('La réponse du serveur est invalide.')
    })
})

describe('profil et session', () => {
    it('ne fait aucune requête sans session', async () => {
        await expect(getProfile(new AbortController().signal)).resolves.toBeNull()
        await expect(updateProfile({ username: 'nouveau' })).resolves.toBeNull()
        await expect(deleteAccount()).resolves.toBe(false)
        expect(fetchMock).not.toHaveBeenCalled()
    })
    it('transmet le token et le signal d’annulation', async () => {
        sessionStorage.setItem('kalon-token', 'session')
        respond(200, { user })

        const signal = new AbortController().signal

        await expect(getProfile(signal)).resolves.toEqual(user)
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/profile'), {
            headers: { Authorization: 'Bearer session' },
            signal
        })
    })
    it.each(['get', 'update', 'delete'])('supprime une session expirée : %s', async operation => {
        sessionStorage.setItem('kalon-token', 'expiré')
        respond(401, {})

        const result = operation === 'get' ? await getProfile(new AbortController().signal) : operation === 'update' ? await updateProfile({ username: 'nouveau' }) : await deleteAccount()

        expect(result).toBe(operation === 'delete' ? false : null)
        expect(sessionStorage.getItem('kalon-token')).toBeNull()
    })
    it('supprime la session après suppression du compte', async () => {
        sessionStorage.setItem('kalon-token', 'session')
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

        await expect(deleteAccount()).resolves.toBe(true)
        expect(sessionStorage.getItem('kalon-token')).toBeNull()
    })
    it('envoie les modifications du profil', async () => {
        sessionStorage.setItem('kalon-token', 'session')
        respond(200, { user })

        await expect(updateProfile({ username: user.username })).resolves.toEqual(user)
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/profileUpdate'), expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ username: user.username })
        }))
    })
})
