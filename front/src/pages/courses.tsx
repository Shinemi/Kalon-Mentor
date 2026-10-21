import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../styles/pages/courses.scss'

type Course = {
    id: string
    title: string
    category: string
    content?: { lesson?: string }
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

const Courses = () => {
    const location = useLocation()
    const [courses, setCourses] = useState<Course[] | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch(`${API_URL}/resources/courses`)
            .then(response => {
                if (!response.ok) throw new Error()
                return response.json()
            })
            .then(data => setCourses(Array.isArray(data.courses) ? data.courses : []))
            .catch(() => setError('Impossible de charger les cours.'))
    }, [])

    useEffect(() => {
        if (!courses || !location.hash) return

        const target = document.getElementById(location.hash.slice(1))
        if (!target) return
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
                        {courses.map(course => <article id={`course-${course.id}`} className="course-card" key={course.id}>
                            <p className="course-category">{course.category}</p>
                            <h2 className="course-title">{course.title}</h2>
                            <p className="course-lesson">{course.content?.lesson || 'Le contenu de ce cours sera bientôt disponible.'}</p>
                        </article>)}
                    </div>
                )}
            </div>
        </main>
    )
}

export default Courses
