import type { SavedAnalysis } from '../services/MentorService'

type HistoryCardProps = {
    analysis: SavedAnalysis
    onView: () => void
    onDelete: () => void
    isDeleting: boolean
    disabled: boolean
}

const HistoryCard = ({ analysis, onView, onDelete, isDeleting, disabled }: HistoryCardProps) => {
    const date = new Date(analysis.createdAt).toLocaleDateString('fr-FR')

    const summary = typeof analysis.feedback.resume === 'string'
        ? analysis.feedback.resume
        : 'Retrouvez le retour de votre mentor sur ce dessin.'

    return (
        <article className="history-card">
            <img src={analysis.imageUrl} alt={`Dessin analysé le ${date}`} loading="lazy" />

            <div className="history-card-content">
                <h2>Analyse du <time dateTime={analysis.createdAt}>{date}</time></h2>
                <p className="history-summary">{summary}</p>

                <div className="history-card-actions">
                    <button type="button" className="button-accent" onClick={onView}>Voir l’analyse</button>
                    <button type="button" className="history-delete" onClick={onDelete} disabled={disabled}>{isDeleting ? 'Suppression…' : 'Supprimer'}</button>
                </div>
            </div>
        </article>
    )
}

export default HistoryCard