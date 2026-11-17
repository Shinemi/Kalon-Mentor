import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import AdminCourses from '../src/components/AdminCourses'
import { getAdminCourses, updateAdminCourse, retireAdminCourse } from '../src/services/AdminService'

vi.mock('../src/services/AdminService', () => ({
    getAdminCourses: vi.fn(), updateAdminCourse: vi.fn(), retireAdminCourse: vi.fn(), createAdminCourse: vi.fn()
}))

const course = {
    id: '11111111-1111-4111-8111-111111111111', title: 'Perspective', category: 'perspective',
    order_index: 1, is_active: true,
    content: { level: 'débutant', lesson: 'Leçon initiale', exercise: 'Exercice', objectives: ['Objectif'], commonMistakes: [] }
}

beforeEach(() => {
    vi.mocked(getAdminCourses).mockReset().mockResolvedValue([course])
    vi.mocked(updateAdminCourse).mockReset()
    vi.mocked(retireAdminCourse).mockReset()
})

it('préremplit le formulaire puis enregistre une modification du cours', async () => {
    vi.mocked(updateAdminCourse).mockResolvedValue({ ...course, title: 'Nouveau titre' })
    const view = render(<MemoryRouter><AdminCourses /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier Perspective' }))
    expect(screen.getByLabelText('Leçon')).toHaveValue('Leçon initiale')
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Nouveau titre' } })
    fireEvent.submit(view.container.querySelector('form')!)
    await screen.findByRole('button', { name: 'Modifier Nouveau titre' })
    expect(updateAdminCourse).toHaveBeenCalledWith(course.id, expect.objectContaining({ title: 'Nouveau titre' }))
})

it('annuler le formulaire n’envoie aucune modification', async () => {
    render(<MemoryRouter><AdminCourses /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier Perspective' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByLabelText('Leçon')).not.toBeInTheDocument()
    expect(updateAdminCourse).not.toHaveBeenCalled()
})

it('demande confirmation du retrait et conserve le cours dans la liste admin', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.mocked(retireAdminCourse).mockResolvedValue(true)
    render(<MemoryRouter><AdminCourses /></MemoryRouter>)
    const button = await screen.findByRole('button', { name: 'Retirer Perspective' })
    fireEvent.click(button)
    expect(retireAdminCourse).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(button)
    await waitFor(() => expect(retireAdminCourse).toHaveBeenCalledExactlyOnceWith(course.id))
    expect(await screen.findByText('Retiré')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier Perspective' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retirer Perspective' })).not.toBeInTheDocument()
})
