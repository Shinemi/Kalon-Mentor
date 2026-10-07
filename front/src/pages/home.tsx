import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, FileUp, Lightbulb, Pencil, BookOpen, Flame } from 'lucide-react'
import '../styles/pages/home.scss'

const Home = () => {
    const [image, setImage] = useState<File | null>(null)
    const [error, setError] = useState('')
    const location = useLocation()

    const selectImage = (file?: File) => {
        setError('')
        setImage(null)
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Choisissez une image JPG, PNG ou WebP.')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Votre image ne doit pas dépasser 10 Mo.')
            return
        }
        setImage(file)
    }

    return (
        <main className="home-page">
            {location.state?.message && <p className="success-message" role="status">{location.state.message}</p>}
            <section className="hero-section" aria-labelledby="hero-title">
                <div className="hero-content">
                    <p className="handwritten">* On échauffe son poignet…</p>
                    <h1 id="hero-title">Maîtrisez <span className='titleAlt'>l’Art</span> du trait</h1>
                    <p>Votre mentor de dessin vous accompagne à chaque étape. Partagez vos croquis, recevez des conseils constructifs et progressez, un trait après l’autre.</p>
                    <Link to="/register" className="button-primary">Commencer mon parcours <ArrowRight aria-hidden="true" /></Link>
                </div>

                <div className="hero-upload" onDragOver={event => event.preventDefault()} onDrop={event => {
                    event.preventDefault()
                    selectImage(event.dataTransfer.files[0])
                }}>
                    <FileUp aria-hidden="true" />
                    <h2>Déposez votre dessin ici</h2>
                    <label htmlFor="drawing">Ou choisissez un fichier</label>
                    <input id="drawing" name="image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="drawing-help" onChange={event => selectImage(event.target.files?.[0])} />
                    <p id="drawing-help">JPG, PNG ou WebP — 10 Mo maximum.</p>
                    {image && <p role="status">Dessin sélectionné : {image.name}</p>}
                    {error && <p role="alert">{error}</p>}

                    <p>La sélection reste sur cette page. L’envoi pour analyse sera disponible dans l’espace mentorat.</p>
                </div>
            </section>

            <section className="features-section" aria-label="Découvrir Kalon Mentor">
                <article className="critique-card">
                    <Lightbulb aria-hidden="true" />
                    <h2>Des conseils bienveillants</h2>
                    <p>Identifiez les points forts de votre dessin et les notions à travailler. Kalon vous propose des explications adaptées à votre style pour vous aider à progresser.</p>
                </article>

                <div className="features-content">
                    <article className="courses-card">
                        
                        <h2><BookOpen aria-hidden="true" />Les fondamentaux</h2>
                        <ul>
                            <li>Perspective</li>
                            <li>Lumière et ombres</li>
                        </ul>
                        <p>Des cours pour comprendre les bases et mettre les conseils en pratique.</p>
                    </article>
                    <article className="exercise-card">
                        <p> Une idée pour pratiquer</p>
                        <h2><Flame aria-hidden="true" />Dessinez un souvenir</h2>
                        <p>Un croquis rapide de 5 minutes.</p>
                    </article>
                </div>
            </section>

            <section className="home-cta" aria-labelledby="cta-title">
                <h2 id="cta-title">Prêt à faire évoluer votre dessin ?</h2>
                <Link to="/register" className="button-primary"><Pencil aria-hidden="true" /> Commencer mon parcours artistique</Link>
                <p className="handwritten">Vous avez le droit de vous tromper.</p>
            </section>
        </main>
    )
}

export default Home
