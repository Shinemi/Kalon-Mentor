import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useDrawing } from '../contexts/drawingContext'

const Mentorship = () => {
    const { image, result, error, isLoading, startAnalysis } = useDrawing()
    const isConnected = Boolean(sessionStorage.getItem('kalon-token'))

    useEffect(() => {
        if (isConnected) void startAnalysis()
    }, [isConnected, startAnalysis])

    if (!isConnected) {
        return <Navigate to="/login" replace />
    }

    return (
        <main className="mentorship-page" aria-busy={isLoading}>
            <h1>Votre mentorat</h1>

            {!image && (
                <p>
                    Choisissez un dessin depuis{' '}
                    <Link to="/">la page d’accueil</Link>
                    {' '}pour lancer une analyse.
                </p>
            )}

            {image && <p>Dessin : {image.name}</p>}

            {isLoading && (
                <p role="status">Analyse de votre dessin en cours…</p>
            )}

            {error && (
                <div>
                    <p role="alert">{error}</p>
                    <button
                        type="button"
                        className="button-primary"
                        disabled={isLoading}
                        onClick={() => void startAnalysis()}
                    >
                        Réessayer l’analyse
                    </button>
                </div>
            )}

            {result && (
                <section aria-labelledby="result-title">
                    <h2 id="result-title">Résultat de l’analyse</h2>

                    <img
                        src={`data:image/jpeg;base64,${result.image}`}
                        alt="Votre dessin analysé"
                        style={{ maxWidth: '100%' }}
                    />

                    {typeof result.feedback.resume === 'string' && (
                        <p>{result.feedback.resume}</p>
                    )}

                    <details>
                        <summary>Voir les détails de l’analyse</summary>
                        <pre
                            style={{
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'anywhere'
                            }}
                        >
                            {JSON.stringify(result.feedback, null, 2)}
                        </pre>
                    </details>
                </section>
            )}
        </main>
    )
}

export default Mentorship