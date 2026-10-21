import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../styles/pages/courses.scss'

type Course = {
    id: string
    title: string
    category: string
    content?: {
        lesson?: string
    }
}

const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '')

const Courses = () => {
    const location = useLocation()
    const [courses, setCourses] = useState<Course[] | null>(null)
    const [error, setError] = useState('')

    const categories = [...new Set(courses?.map(course => course.category) ?? [])]

    useEffect(() => {
        const controller = new AbortController()

        const loadCourses = async () => {
            try {
                const response = await fetch(`${API_URL}/resources/courses`, {
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error('Impossible de charger les cours.')
                }

                const data = await response.json()
                setCourses(Array.isArray(data.courses) ? data.courses : [])
            } catch {
                if (!controller.signal.aborted) {
                    setError('Impossible de charger les cours.')
                }
            }
        }

        loadCourses()

        return () => controller.abort()
    }, [])

    useEffect(() => {
        if (!courses || !location.hash) return

        const target = document.getElementById(location.hash.slice(1))

        if (!(target instanceof HTMLDetailsElement)) return

        const category = target.parentElement?.closest('details')

        if (category) {
            category.open = true
        }

        target.open = true
        target.scrollIntoView({ behavior: 'smooth' })
    }, [courses, location.hash])

    return (
        <main className="courses-page">
            <div className="courses-content">
                <h1>Les cours</h1>
                <p>Retrouvez ici les notions recommandées par votre mentor et avancez à votre rythme.</p>

                {error ? (
                    <p className="courses-error" role="alert">{error}</p>
                ) : courses === null ? (
                    <p role="status">Chargement des cours…</p>
                ) : courses.length === 0 ? (
                    <p>Aucun cours n’est disponible pour le moment.</p>
                ) : (
                    <div className="courses-list">
                        {categories.map(category => (
                            <details className="course-category" key={category}>
                                <summary className="category-summary">
                                    <h2>{category}</h2>
                                </summary>

                                <div className="category-courses">
                                    {courses
                                        .filter(course => course.category === category)
                                        .map(course => (
                                            <details id={`course-${course.id}`} className="course-card" key={course.id}>
                                                <summary className="course-summary">
                                                    <h3>{course.title}</h3>
                                                </summary>

                                                <div className="course-content">
                                                    <p className="course-lesson">{course.content?.lesson || 'Le contenu de ce cours sera bientôt disponible.'}</p>
                                                </div>
                                            </details>
                                        ))}
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

export default Courses