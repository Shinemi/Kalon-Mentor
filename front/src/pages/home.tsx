// import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, FileUp, Lightbulb, Pencil, BookOpen, Flame } from 'lucide-react'
import '../styles/pages/home.scss'

const Home = () => {
    const isConnected = Boolean(sessionStorage.getItem('kalon-token'))
    const uploadDestination = isConnected ? '/mentorship' : '/login'
    const location = useLocation()

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

                <Link
                    to={uploadDestination}
                    className="hero-upload"
                    aria-labelledby="upload-title"
                    aria-describedby="drawing-help"
                >
                    <FileUp aria-hidden="true" />
                    <h2 id="upload-title">Partagez votre dessin</h2>
                    <span className="button-accent">Choisir un fichier</span>
                    <p id="drawing-help">JPG, PNG ou WebP — 10 Mo maximum.</p>
                    <p>
                        {isConnected
                            ? 'Accédez au mentorat pour importer votre dessin.'
                            : 'Connectez-vous pour importer votre dessin.'}
                    </p>
                </Link>
            </section>

            <section className="features-section" aria-label="Découvrir Kalon Mentor">
                <article className="critique-card">
                    <Lightbulb aria-hidden="true" />
                    <h2>Des conseils bienveillants</h2>
                    <p>Identifiez les points forts de votre dessin et les notions à travailler. Kalon vous propose des explications adaptées à votre style pour vous aider à progresser.</p>
                </article>

                <div className="features-content">
                    <Link to="/courses" className="courses-card">
                        <h2><BookOpen aria-hidden="true" />Les fondamentaux</h2>
                        <ul>
                            <li>Perspective</li>
                            <li>Lumière et ombres</li>
                        </ul>
                        <p>Des cours pour comprendre les bases et mettre les conseils en pratique.</p>
                    </Link>
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
