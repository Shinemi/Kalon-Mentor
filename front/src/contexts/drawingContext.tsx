import { createContext, useContext } from 'react'
import type { AnalysisResult } from '../services/mentorService'

type DrawingContextValue = {
    image: File | null
    result: AnalysisResult | null
    error: string
    isLoading: boolean
    selectImage: (file: File) => boolean
    startAnalysis: () => Promise<void>
}

export const DrawingContext = createContext<DrawingContextValue | null>(null)

export const useDrawing = () => {
    const context = useContext(DrawingContext)

    if (!context) {
        throw new Error('DrawingProvider est manquant.')
    }

    return context
}