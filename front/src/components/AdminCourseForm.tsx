import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAdminCourse } from '../services/AdminService'
import type { AdminCourse } from '../services/AdminService'

const toList = (text: string) => text.split('\n').map(line => line.trim()).filter(line => line !== '')

const AdminCourseForm = ({ onCreated }: { onCreated: (course: AdminCourse) => void }) => {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isSaving) return

        const form = event.currentTarget
        const fields = new FormData(form)

        setError('')
        setSuccess('')
        setIsSaving(true)

        try {
            const course = await createAdminCourse({
                title: String(fields.get('title') ?? ''),
                category: String(fields.get('category') ?? ''),
                order_index: Number(fields.get('order_index')),
                content: {
                    level: String(fields.get('level') ?? ''),
                    lesson: String(fields.get('lesson') ?? ''),
                    exercise: String(fields.get('exercise') ?? ''),
                    objectives: toList(String(fields.get('objectives') ?? '')),
                    commonMistakes: toList(String(fields.get('commonMistakes') ?? ''))
                }
            })

            if (!course) {
                navigate('/login', { replace: true })
                return
            }

            form.reset()
            onCreated(course)
            setSuccess('Le cours a été créé et ajouté au catalogue.')
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Impossible de créer le cours.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form id="course-create-form" className="admin-course-form" onSubmit={handleSubmit} aria-labelledby="course-create-title" aria-busy={isSaving}>
            <h2 id="course-create-title">Ajouter un cours</h2>

            <fieldset disabled={isSaving}>
                <legend>Contenu du cours</legend>

                <label htmlFor="course-title">Titre</label>
                <input id="course-title" name="title" type="text" maxLength={200} required />

                <label htmlFor="course-category">Catégorie</label>
                <select id="course-category" name="category" defaultValue="proportions" required>
                    <option value="proportions">Proportions</option>
                    <option value="anatomie">Anatomie</option>
                    <option value="perspective">Perspective</option>
                    <option value="composition">Composition</option>
                    <option value="couleurs">Couleurs</option>
                    <option value="lumiere">Lumière</option>
                </select>

                <label htmlFor="course-order">Ordre dans la catégorie</label>
                <input id="course-order" name="order_index" type="number" min={1} max={2147483647} step={1} required />

                <label htmlFor="course-level">Niveau</label>
                <select id="course-level" name="level" defaultValue="débutant" required>
                    <option value="débutant">Débutant</option>
                    <option value="intermédiaire">Intermédiaire</option>
                    <option value="avancé">Avancé</option>
                </select>

                <label htmlFor="course-lesson">Leçon</label>
                <textarea id="course-lesson" name="lesson" rows={6} required />

                <label htmlFor="course-exercise">Exercice</label>
                <textarea id="course-exercise" name="exercise" rows={3} required />

                <label htmlFor="course-objectives">Objectifs — un par ligne, facultatif</label>
                <textarea id="course-objectives" name="objectives" rows={3} />

                <label htmlFor="course-mistakes">Erreurs fréquentes — une par ligne, facultatif</label>
                <textarea id="course-mistakes" name="commonMistakes" rows={3} />

                <button type="submit" className="button-primary">{isSaving ? 'Création…' : 'Créer le cours'}</button>
            </fieldset>

            {error && <p role="alert">{error}</p>}
            {success && <p role="status">{success}</p>}
        </form>
    )
}

export default AdminCourseForm