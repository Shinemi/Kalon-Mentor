import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminCourses, retireAdminCourse } from '../services/AdminService'
import type { AdminCourse } from '../services/AdminService'
import AdminCourseForm from './AdminCourseForm'

const AdminCourses = () => {
    const [courses, setCourses] = useState<AdminCourse[] | null>(null)
    const [error, setError] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editing, setEditing] = useState<AdminCourse | undefined>()
    const [actionError, setActionError] = useState('')
    const [isRetiring, setIsRetiring] = useState(false)
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

    const retire = async (course: AdminCourse) => {
        if (isRetiring || !window.confirm(`Retirer « ${course.title} » du catalogue ? Les anciennes analyses conserveront leurs références.`)) return
        setIsRetiring(true)
        setActionError('')
        try {
            if (!await retireAdminCourse(course.id)) {
                navigate('/login', { replace: true })
                return
            }
            setCourses(current => current?.map(item => item.id === course.id ? { ...item, is_active: false } : item) ?? [])
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Impossible de retirer le cours.')
        } finally {
            setIsRetiring(false)
        }
    }

    return (
        <>
            <button
                type="button"
                className="button-accent"
                aria-expanded={isCreating}
                aria-controls="course-create-form"
                onClick={() => { setEditing(undefined); setIsCreating(current => !current) }}
            >
                {isCreating ? 'Fermer le formulaire' : 'Ajouter un cours'}
            </button>

            {(isCreating || editing) && (
                <AdminCourseForm key={editing?.id ?? 'new'} initial={editing}
                    onCancel={() => { setIsCreating(false); setEditing(undefined) }}
                    onCreated={course => {
                        setCourses(current => editing
                            ? (current ?? []).map(item => item.id === course.id ? course : item)
                            : [course, ...(current ?? [])])
                        setEditing(undefined)
                        setIsCreating(false)
                    }} />
            )}

            {actionError && <p role="alert">{actionError}</p>}

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
                                <th scope="col">État</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(course => (
                                <tr key={course.id}>
                                    <td>{course.title}</td>
                                    <td>{course.category}</td>
                                    <td>{course.content?.level || 'Non renseigné'}</td>
                                    <td>{course.order_index ?? '—'}</td>
                                    <td>{course.is_active === false ? 'Retiré' : 'Actif'}</td>
                                    <td>
                                        <button type="button" className="button-accent" onClick={() => { setIsCreating(false); setEditing(course) }}>Modifier {course.title}</button>
                                        {course.is_active !== false && <button type="button" className="button-accent" disabled={isRetiring} onClick={() => retire(course)}>Retirer {course.title}</button>}
                                    </td>
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
