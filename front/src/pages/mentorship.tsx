import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileUp } from 'lucide-react'
import { analyseImage } from '../services/mentorService'
import type { AnalysisResult } from '../services/mentorService'
import '../styles/pages/mentorship.scss'
import DrawingAnalysis from '../components/drawingAnalysis'

const Mentorship = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [image, setImage] = useState<File | null>(() => {
        return location.state?.image instanceof File
            ? location.state.image
            : null
    })

    const [previewUrl, setPreviewUrl] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)

    useEffect(() => {
        if (!image) return

        const reader = new FileReader()

        reader.onload = () => {
            setPreviewUrl(String(reader.result))
        }

        reader.onerror = () => {
            setError('Impossible de lire cette image. Choisissez un autre fichier.')
        }

        reader.readAsDataURL(image)

        return () => reader.abort()
    }, [image])

    const handleImage = (file?: File) => {
        if (!file || isLoading) return

        setError('')

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Choisissez une image JPG, PNG ou WebP.')
            return
        }

        if (file.size === 0 || file.size > 10 * 1024 * 1024) {
            setError('Choisissez une image non vide de 10 Mo maximum.')
            return
        }

        setResult(null)
        setPreviewUrl('')
        setImage(file)
    }

    const removeImage = () => {
        if (isLoading) return

        setImage(null)
        setPreviewUrl('')
        setResult(null)
        setError('')
    }

    const handleAnalyse = async () => {
        if (!image || !previewUrl || isLoading || result) return

        setError('')
        setIsLoading(true)

        try {
            const analysis = await analyseImage(image)

            if (!analysis) {
                navigate('/login', {
                    state: { image }
                })
                return
            }

            setResult(analysis)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Une erreur est survenue pendant l’analyse.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="mentorship-page">
            <div className="mentorship-content">
                <div className="mentorship-heading">
                    <h1>Votre atelier de mentorat</h1>
                    <p>Partagez votre dessin pour découvrir ses points forts et les pistes à explorer.</p>
                </div>

                {!result ? (
                    <section className="drawing-upload" aria-labelledby="drawing-title">
                        <h2 id="drawing-title">Votre dessin</h2>

                        <label className="drawing-picker">
                            <FileUp aria-hidden="true" />
                            <span>{image ? 'Choisir un autre dessin' : 'Choisir un dessin'}</span>

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                aria-label="Choisir un dessin"
                                aria-describedby="drawing-help"
                                disabled={isLoading}
                                onChange={event => {
                                    handleImage(event.target.files?.[0])
                                    event.target.value = ''
                                }}
                            />
                        </label>

                        <p id="drawing-help" className="drawing-help">JPG, PNG ou WebP — 10 Mo maximum.</p>

                        {error && (
                            <p className="drawing-error" role="alert">{error}</p>
                        )}

                        {image && (
                            <div className="drawing-selection">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Aperçu de votre dessin" />
                                ) : !error ? (
                                    <p role="status">Préparation de l’aperçu…</p>
                                ) : null}

                                <p className="drawing-filename">{image.name}</p>

                                <div className="drawing-actions">
                                    <button
                                        type="button"
                                        className="button-primary"
                                        onClick={handleAnalyse}
                                        disabled={isLoading || !previewUrl}
                                    >
                                        {isLoading ? 'Analyse en cours…' : 'Analyser mon dessin'}
                                    </button>

                                    <button
                                        type="button"
                                        className="drawing-remove"
                                        onClick={removeImage}
                                        disabled={isLoading}
                                    >
                                        Retirer le dessin
                                    </button>
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <p className="drawing-status" role="status">Votre dessin est en cours d’analyse. Cela peut prendre quelques instants.</p>
                        )}
                    </section>
                ) : (
                    <DrawingAnalysis result={result} imageUrl={previewUrl} onReset={removeImage} />
                )}

                <p className="analysis-announcement" role="status">{result ? 'L’analyse de votre dessin est disponible.' : ''}</p>
            </div>
        </main>
    )
}

export default Mentorship