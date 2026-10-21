import { Link } from 'react-router-dom'
import type { AnalysisResult } from '../services/mentorService'
import '../styles/components/drawingAnalysis.scss'


type DrawingAnalysisProps = {
    result: AnalysisResult
    imageUrl: string
    onReset: () => void
    onSave: () => void
    isSaving: boolean
    isSaved: boolean
}

const getObject = (value: unknown): Record<string, unknown> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {}
    }

    return value as Record<string, unknown>
}

const getText = (value: unknown): string => {
    return typeof value === 'string' ? value : ''
}

const getList = (value: unknown): string[] => {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []
}

const getScore = (value: unknown): number | null => {
    return typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100
        ? value
        : null
}

const categories = [
    { key: 'anatomie', label: 'Anatomie' },
    { key: 'perspective', label: 'Perspective' },
    { key: 'composition', label: 'Composition' },
    { key: 'couleurs', label: 'Couleurs' },
    { key: 'lumiere', label: 'Lumière' }
]

const DrawingAnalysis = ({ result, imageUrl, onReset, onSave, isSaving, isSaved }: DrawingAnalysisProps) => {
    const feedback = result.feedback
    const style = getObject(feedback.style)
    const analysis = getObject(feedback.analyse)
    const strengths = getList(feedback.forces)
    const weaknesses = getList(feedback.faiblesses)
    const globalScore = getScore(feedback.score_global)

    const resources = Array.isArray(feedback.ressources_recommandees)
        ? feedback.ressources_recommandees
            .map(getObject)
            .filter(resource => getText(resource.titre))
            .sort((a, b) => {
                const priorityA = typeof a.priorite === 'number' ? a.priorite : 99
                const priorityB = typeof b.priorite === 'number' ? b.priorite : 99

                return priorityA - priorityB
            })
        : []

    return (
        <section className="drawing-analysis" aria-labelledby="analysis-title">
            <h2 id="analysis-title">Le regard de votre mentor</h2>

            <div className="analysis-overview">
                <figure className="analysis-drawing">
                    <img src={imageUrl} alt="Votre dessin analysé" />
                    <figcaption>Votre point de départ, un trait après l’autre.</figcaption>
                </figure>

                <div className="analysis-summary analysis-card">
                    <h3>Le retour du mentor</h3>
                    <p>{getText(feedback.resume) || 'Le résumé n’est pas disponible.'}</p>

                    {getText(style.type) && (
                        <p><strong>Style identifié :</strong> {getText(style.type)}</p>
                    )}

                    {getText(style.impact_sur_analyse) && (
                        <p className="analysis-style">{getText(style.impact_sur_analyse)}</p>
                    )}

                    <div className="analysis-global-score">
                        <span>Maîtrise observable estimée</span>
                        <strong>{globalScore === null ? 'Non évaluée' : `${globalScore} / 100`}</strong>
                    </div>
                </div>
            </div>

            <p className="analysis-disclaimer">Ces indications sont générées par IA et peuvent comporter des erreurs. Elles accompagnent votre pratique et ne constituent pas une note officielle.</p>

            <div className="analysis-feedback-grid">
                <section className="analysis-card" aria-labelledby="strengths-title">
                    <h3 id="strengths-title">Vos points forts</h3>

                    {strengths.length > 0 ? (
                        <ul>
                            {strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucun point fort détaillé dans ce retour.</p>
                    )}
                </section>

                <section className="analysis-card analysis-improvements" aria-labelledby="weaknesses-title">
                    <h3 id="weaknesses-title">Les pistes à explorer</h3>

                    {weaknesses.length > 0 ? (
                        <ul>
                            {weaknesses.map((weakness, index) => (
                                <li key={index}>{weakness}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune piste d’amélioration particulière signalée.</p>
                    )}
                </section>
            </div>

            <section className="analysis-details" aria-labelledby="details-title">
                <h3 id="details-title">Votre dessin en détail</h3>

                <div className="analysis-category-grid">
                    {categories.map(category => {
                        const detail = getObject(analysis[category.key])
                        const score = getScore(detail.score)
                        const skills = getList(detail.competences_a_travailler)

                        return (
                            <article className={`analysis-card analysis-category-${category.key}`} key={category.key}>
                                <div className="analysis-category-heading">
                                    <h4>{category.label}</h4>
                                    <span>{score === null ? 'Non évalué' : `${score} / 100`}</span>
                                </div>

                                {score !== null && (
                                    <meter
                                        min={0}
                                        max={100}
                                        value={score}
                                        aria-label={`Maîtrise estimée en ${category.label}`}
                                    />
                                )}

                                <p>{getText(detail.commentaire) || 'Pas de commentaire disponible pour cette catégorie.'}</p>

                                {skills.length > 0 && (
                                    <>
                                        <h5>À travailler</h5>
                                        <ul>
                                            {skills.map((skill, index) => (
                                                <li key={index}>{skill}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </article>
                        )
                    })}
                </div>
            </section>

            <section className="analysis-resources" aria-labelledby="resources-title">
                <h3 id="resources-title">Pour poursuivre votre apprentissage</h3>

                {resources.length > 0 ? (
                    <div className="analysis-resource-grid">
                        {resources.map((resource, index) => {
                            const anchor = resource.type === 'course' ? `course-${resource.ressource_id}` : null
                            const content = (
                                <>
                                    <h4>{getText(resource.titre)}</h4>
                                    <p>{getText(resource.raison)}</p>
                                    {getText(resource.competence) && <p className="analysis-resource-skill">À travailler : {getText(resource.competence)}</p>}
                                    {anchor && <span className="analysis-resource-link">Lire ce cours →</span>}
                                </>
                            )

                            return anchor
                                ? <Link to={`/courses#${anchor}`} className="analysis-card analysis-course-link" key={index}>{content}</Link>
                                : <article className="analysis-card" key={index}>{content}</article>
                        })}
                    </div>
                ) : (
                    <p>Aucune ressource complémentaire recommandée pour ce dessin.</p>
                )}

                <Link to="/courses" className="button-accent">
                    Explorer les cours
                </Link>
            </section>

            <div className="analysis-actions">
                <button type="button" className="button-primary" onClick={onSave} disabled={isSaving || isSaved}>{isSaving ? 'Enregistrement…' : isSaved ? 'Analyse sauvegardée' : 'Sauvegarder cette analyse'}</button>
                <button type="button" className="button-accent" onClick={onReset} disabled={isSaving}>Analyser un autre dessin</button>
            </div>
            {isSaved && <p className="analysis-saved-message" role="status">Cette analyse est enregistrée dans votre galerie.</p>}
        </section>
    )
}

export default DrawingAnalysis
