import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://kalon-mentor.vercel.app'

type PageSeo = {
    title: string
    description: string
    indexable: boolean
}

const pages: Record<string, PageSeo> = {
    '/': {
        title: 'Kalon Mentor — Analyse de dessin IA et cours gratuits',
        description: 'Analysez vos dessins avec un mentor IA et progressez grâce à des conseils pédagogiques et à des cours de dessin gratuits.',
        indexable: true
    },
    '/courses': {
        title: 'Cours de dessin gratuits — Kalon Mentor',
        description: 'Explorez 48 cours de dessin gratuits : proportions, anatomie, perspective, composition, couleurs et lumière, avec des objectifs et des exercices.',
        indexable: true
    },
    '/legal': {
        title: 'Mentions légales et CGU — Kalon Mentor',
        description: 'Consultez les mentions légales, les conditions d’utilisation et la politique de confidentialité de Kalon Mentor, ainsi que la gestion des cookies.',
        indexable: true
    },
    '/login': {
        title: 'Connexion — Kalon Mentor',
        description: 'Connectez-vous à votre espace personnel Kalon Mentor.',
        indexable: false
    },
    '/register': {
        title: 'Inscription — Kalon Mentor',
        description: 'Créez votre compte Kalon Mentor pour accéder au mentorat et à votre historique personnel.',
        indexable: false
    },
    '/profile': {
        title: 'Mon profil — Kalon Mentor',
        description: 'Gérez vos informations personnelles et votre compte Kalon Mentor.',
        indexable: false
    },
    '/gallery': {
        title: 'Mon historique — Kalon Mentor',
        description: 'Retrouvez vos dessins et les analyses sauvegardées dans votre espace personnel.',
        indexable: false
    },
    '/mentorship': {
        title: 'Mentorat en dessin — Kalon Mentor',
        description: 'Soumettez votre dessin au mentor et consultez ses conseils pédagogiques.',
        indexable: false
    },
    '/forgot-password': {
        title: 'Mot de passe oublié — Kalon Mentor',
        description: 'Demandez un lien pour réinitialiser votre mot de passe Kalon Mentor.',
        indexable: false
    },
    '/reset-password': {
        title: 'Réinitialiser mon mot de passe — Kalon Mentor',
        description: 'Choisissez un nouveau mot de passe pour votre compte Kalon Mentor.',
        indexable: false
    }
}

const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
    let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)

    if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, key)
        document.head.appendChild(meta)
    }

    meta.content = content
}

const Seo = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        const path = pathname.toLowerCase().replace(/\/+$/, '') || '/'

        const page = pages[path] ?? {
            title: 'Page introuvable — Kalon Mentor',
            description: 'Cette page n’existe pas. Retrouvez l’accueil et les cours de Kalon Mentor.',
            indexable: false
        }

        document.title = page.title

        setMeta('name', 'description', page.description)
        setMeta('name', 'robots', page.indexable ? 'index,follow' : 'noindex,follow')
        setMeta('property', 'og:title', page.title)
        setMeta('property', 'og:description', page.description)
        setMeta('name', 'twitter:title', page.title)
        setMeta('name', 'twitter:description', page.description)

        let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

        if (page.indexable) {
            const url = SITE_URL + path

            if (!canonical) {
                canonical = document.createElement('link')
                canonical.rel = 'canonical'
                document.head.appendChild(canonical)
            }

            canonical.href = url
            setMeta('property', 'og:url', url)
        } else {
            canonical?.remove()
            document.querySelector('meta[property="og:url"]')?.remove()
        }
    }, [pathname])

    return null
}

export default Seo