import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import SaveLimitDialog from '../src/components/SaveLimitDialog'

it('ouvre la galerie dans un nouvel onglet pour garder le résultat en cours', () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: vi.fn() })
    const close = vi.fn()
    const view = render(<MemoryRouter><SaveLimitDialog limit={10} onClose={close} /></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Gérer ma galerie', hidden: true })
    expect(link).toHaveAttribute('href', '/gallery')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent(view.container.querySelector('dialog')!, new Event('close'))
    expect(close).toHaveBeenCalledOnce()
    delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal
})
