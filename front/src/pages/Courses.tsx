import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../styles/pages/courses.scss'

type Course = {
    id: string
    title: string
    category: string
    content?: {
        level?: string
        lesson?: string
        exercise?: string
        objectives?: string[]
        commonMistakes?: string[]
    }
}

const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '')

const CourseList = ({ courses, hash }: { courses: Course[]; hash: string }) => {
    const targetCourse = courses.find(course => `#course-${course.id}` === hash)

    const [openCategories, setOpenCategories] = useState<string[]>(
        targetCourse ? [targetCourse.category] : []
    )

    const [openCourses, setOpenCourses] = useState<string[]>(
        targetCourse ? [targetCourse.id] : []
    )

    const categories = [...new Set(courses.map(course => course.category))]

    useEffect(() => {
        if (!targetCourse) return

        const title = document.getElementById(`course-${targetCourse.id}`)

        if (title) {
            title.focus({ preventScroll: true })
            title.scrollIntoView({ block: 'start' })
        }
    }, [targetCourse])

    const toggleCategory = (category: string) => {
        setOpenCategories(current => current.includes(category)
            ? current.filter(value => value !== category)
            : [...current, category]
        )
    }

    const toggleCourse = (id: string) => {
        setOpenCourses(current => current.includes(id)
            ? current.filter(value => value !== id)
            : [...current, id]
        )
    }

    return (
        <div className="courses-list">
            {categories.map((category, index) => {
                const categoryOpen = openCategories.includes(category)
                const categoryId = `category-${index}`

                return (
                    <section className="course-category" key={category}>
                        <h2>
                            <button type="button" className="category-summary" aria-expanded={categoryOpen} aria-controls={categoryId} onClick={() => toggleCategory(category)}>{category}</button>
                        </h2>

                        <div id={categoryId} className="category-courses" hidden={!categoryOpen}>
                            {courses.filter(course => course.category === category).map(course => {
                                const courseOpen = categoryOpen && openCourses.includes(course.id)
                                const courseId = `course-${course.id}`

                                return (
                                    <article className="course-card" key={course.id}>
                                        <h3>
                                            <button id={courseId} type="button" className="course-summary" aria-expanded={courseOpen} aria-controls={`${courseId}-content`} onClick={() => toggleCourse(course.id)}>{course.title}</button>
                                        </h3>

                                        <div id={`${courseId}-content`} className="course-content" hidden={!courseOpen}>
                                            {courseOpen && (
                                                <>
                                                    {course.content?.level && (
                                                        <p className="course-level"><strong>Niveau :</strong> {course.content.level}</p>
                                                    )}

                                                    {course.content?.objectives && course.content.objectives.length > 0 && (
                                                        <section>
                                                            <h4>Les objectifs</h4>
                                                            <ul>
                                                                {course.content.objectives.map(objective => (
                                                                    <li key={objective}>{objective}</li>
                                                                ))}
                                                            </ul>
                                                        </section>
                                                    )}

                                                    <section>
                                                        <h4>La leçon</h4>
                                                        <p className="course-lesson">{course.content?.lesson || 'Le contenu de ce cours sera bientôt disponible.'}</p>
                                                    </section>

                                                    {course.content?.exercise && (
                                                        <section className="course-exercise">
                                                            <h4>À vous de jouer</h4>
                                                            <p>{course.content.exercise}</p>
                                                        </section>
                                                    )}

                                                    {course.content?.commonMistakes && course.content.commonMistakes.length > 0 && (
                                                        <section>
                                                            <h4>Les erreurs fréquentes</h4>
                                                            <ul>
                                                                {course.content.commonMistakes.map(mistake => (
                                                                    <li key={mistake}>{mistake}</li>
                                                                ))}
                                                            </ul>
                                                        </section>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}

const Courses = () => {
    const location = useLocation()
    const [courses, setCourses] = useState<Course[] | null>(null)
    const [error, setError] = useState('')

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

                if (!controller.signal.aborted) {
                    setCourses(Array.isArray(data.courses) ? data.courses : [])
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError('Impossible de charger les cours.')
                }
            }
        }

        loadCourses()

        return () => controller.abort()
    }, [])

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
                    <CourseList key={location.key + location.hash} courses={courses} hash={location.hash} />
                )}
            </div>
        </main>
    )
}

export default Courses