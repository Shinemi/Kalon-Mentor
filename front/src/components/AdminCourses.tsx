import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminCourses } from '../services/AdminService'
import type { AdminCourse } from '../services/AdminService'
import AdminCourseForm from './AdminCourseForm'

const AdminCourses = () => {
    const [courses, setCourses] = useState<AdminCourse[] | null>(null)
    const [error, setError] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()

        const loadCourses = async () => {
            try {
                const data = await getAdminCourses(controller.signal)
                if (controller.signal.aborted) return

                if (!data) {
                    navigate('/login', { replace: true })
                    return
                }

                setCourses(data)
            } catch (error) {
                if (controller.signal.aborted) return

                setError(error instanceof Error ? error.message : 'Impossible de charger les cours.')
            }
        }

        loadCourses()
        return () => controller.abort()
    }, [navigate])

    if (error) return <p role="alert">{error}</p>
    if (!courses) return <p role="status">Chargement des cours…</p>

    return (
        <>
            <button
                type="button"
                className="button-accent"
                aria-expanded={isCreating}
                aria-controls="course-create-form"
                onClick={() => setIsCreating(current => !current)}
            >
                {isCreating ? 'Fermer le formulaire' : 'Ajouter un cours'}
            </button>

            {isCreating && (
                <AdminCourseForm onCreated={course => setCourses(current => [course, ...(current ?? [])])} />
            )}

            {courses.length === 0 ? (
                <p>Aucun cours à afficher.</p>
            ) : (
                <div className="admin-table" role="region" aria-label="Liste des cours" tabIndex={0}>
                    <table>
                        <caption>{courses.length} cours</caption>
                        <thead>
                            <tr>
                                <th scope="col">Titre</th>
                                <th scope="col">Catégorie</th>
                                <th scope="col">Niveau</th>
                                <th scope="col">Ordre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(course => (
                                <tr key={course.id}>
                                    <td>{course.title}</td>
                                    <td>{course.category}</td>
                                    <td>{course.content?.level || 'Non renseigné'}</td>
                                    <td>{course.order_index ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    )
}

export default AdminCourses