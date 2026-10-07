import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DrawingContext } from './drawingContext'
import { analyseImage } from '../services/mentorService'
import type { AnalysisResult } from '../services/mentorService'

const DrawingProvider = ({ children }: { children: ReactNode }) => {
    const [image, setImage] = useState<File | null>(null)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const inFlight = useRef(false)

    const selectImage = (file: File) => {
        if (inFlight.current) {
            setError('Attendez la fin de l’analyse avant de changer de dessin.')
            return false
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Choisissez une image JPG, PNG ou WebP.')
            return false
        }

        if (file.size === 0 || file.size > 10 * 1024 * 1024) {
            setError('Choisissez une image non vide de 10 Mo maximum.')
            return false
        }

        setError('')
        setResult(null)
        setImage(file)
        return true
    }

    const startAnalysis = useCallback(async () => {
        if (!image || result || inFlight.current) return
        if (!sessionStorage.getItem('kalon-token')) return

        // Bloque immédiatement les doubles envois, même avec StrictMode.
        inFlight.current = true
        setIsLoading(true)
        setError('')

        try {
            setResult(await analyseImage(image))
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Impossible de joindre le serveur.'
            )
        } finally {
            inFlight.current = false
            setIsLoading(false)
        }
    }, [image, result])

    return (
        <DrawingContext.Provider value={{ image, result, error, isLoading, selectImage, startAnalysis }}>
            {children}
        </DrawingContext.Provider>
    )
}

export default DrawingProvider