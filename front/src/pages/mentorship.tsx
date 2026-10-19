import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FileUp } from 'lucide-react'
import '../styles/pages/mentorship.scss'

const Mentorship = () => {
    const location = useLocation()

    const [image, setImage] = useState<File | null>(() => {
        return location.state?.image instanceof File
            ? location.state.image
            : null
    })

    const [previewUrl, setPreviewUrl] = useState('')
    const [error, setError] = useState('')

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
        if (!file) return

        setError('')

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Choisissez une image JPG, PNG ou WebP.')
            return
        }

        if (file.size === 0 || file.size > 10 * 1024 * 1024) {
            setError('Choisissez une image non vide de 10 Mo maximum.')
            return
        }

        setPreviewUrl('')
        setImage(file)
    }

    const removeImage = () => {
        setImage(null)
        setPreviewUrl('')
        setError('')
    }

    return (
        <main className="mentorship-page">
            <div className="mentorship-content">
                <div className="mentorship-heading">
                    <h1>Votre atelier de mentorat</h1>
                    <p>Partagez votre dessin pour découvrir ses points forts et les pistes à explorer.</p>
                </div>

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

                            <button type="button" className="drawing-remove" onClick={removeImage}>
                                Retirer le dessin
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Mentorship