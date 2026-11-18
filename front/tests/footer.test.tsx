import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import Footer from '../src/components/Footer'

it('dirige le contact vers les coordonnées publiques sans exposer de mail personnel dans le footer', () => {
    const view = render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Contact et assistance' })).toHaveAttribute('href', '/legal#contact')
    expect(view.container.querySelector('a[href^="mailto:"]')).toBeNull()
})
