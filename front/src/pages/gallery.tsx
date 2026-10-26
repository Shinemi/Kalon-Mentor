import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getHistory, deleteAnalysis } from '../services/mentorService'
import type { SavedAnalysis } from '../services/mentorService'
import HistoryCard from '../components/historyCard'
import DrawingAnalysis from '../components/drawingAnalysis'
import '../styles/pages/gallery.scss'

const Gallery = () => {
    const navigate = useNavigate()
    const headingRef = useRef<HTMLHeadingElement>(null)

    const [corrections, setCorrections] = useState<SavedAnalysis[] | null>(null)
    const [maxCorrections, setMaxCorrections] = useState(0)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const selected = corrections?.find(correction => correction.id === selectedId)

    useEffect(() => {
        const controller = new AbortController()

        const loadHistory = async () => {
            try {
                const data = await getHistory(controller.signal)
                if (controller.signal.aborted) return

                if (!data) {
                    navigate('/login', { replace: true })
                    return
                }

                setCorrections(data.corrections)
                setMaxCorrections(data.maxCorrections)
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(error instanceof Error ? error.message : 'Impossible de charger votre historique.')
                }
            }
        }

        loadHistory()

        return () => controller.abort()
    }, [navigate])

    useEffect(() => {
        headingRef.current?.focus({ preventScroll: true })
    }, [selectedId])

    const handleView = (id: string | null) => {
        setSelectedId(id)
        window.scrollTo({ top: 0 })
    }

    const handleDelete = async (id: string) => {
        if (deletingId) return
        if (!window.confirm('Supprimer définitivement cette analyse et son dessin ?')) return

        setDeletingId(id)
        setError('')
        setSuccess('')

        try {
            const deleted = await deleteAnalysis(id)

            if (!deleted) {
                navigate('/login', { replace: true })
                return
            }

            setCorrections(current => current ? current.filter(correction => correction.id !== id) : null)
            setSuccess('L’analyse a été supprimée. Une place a été libérée.')
            headingRef.current?.focus({ preventScroll: true })
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Impossible de supprimer cette analyse.')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <main className="history-page">
            <div className="history-content">
                <div className="history-heading">
                    <h1 ref={headingRef} tabIndex={-1}>{selected ? 'Votre analyse sauvegardée' : 'Mon historique'}</h1>
                    <p>Retrouvez vos dessins et les conseils de votre mentor.</p>
                    {corrections !== null && <p className="history-count">{corrections.length} / {maxCorrections} analyses sauvegardées</p>}
                </div>

                {error && <p className="history-error" role="alert">{error}</p>}
                {success && <p className="history-success" role="status">{success}</p>}

                {corrections === null ? (
                    !error && <p role="status">Chargement de votre historique…</p>
                ) : selected ? (
                    <>
                        <button type="button" className="button-accent history-back" onClick={() => handleView(null)}>Retour à l’historique</button>
                        <DrawingAnalysis result={{ feedback: selected.feedback, image: '' }} imageUrl={selected.imageUrl} />
                    </>
                ) : corrections.length === 0 ? (
                    <section className="history-empty">
                        <h2>Votre carnet attend ses premiers dessins</h2>
                        <p>Analysez un dessin, puis sauvegardez le retour pour le retrouver ici.</p>
                        <Link to="/mentorship" className="button-primary">Analyser un dessin</Link>
                    </section>
                ) : (
                    <div className="history-grid">
                        {corrections.map(correction => (
                            <HistoryCard
                                key={correction.id}
                                analysis={correction}
                                onView={() => handleView(correction.id)}
                                onDelete={() => handleDelete(correction.id)}
                                isDeleting={deletingId === correction.id}
                                disabled={deletingId !== null}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

export default Gallery