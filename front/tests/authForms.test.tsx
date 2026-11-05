import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import Form from '../src/components/Form'
import PasswordRecovery from '../src/pages/PassWordRecovery'
import { authenticate, recoverPassword } from '../src/services/AuthService'
vi.mock('../src/services/AuthService', () => ({ authenticate: vi.fn(), recoverPassword: vi.fn() }))
beforeEach(() => { vi.mocked(authenticate).mockReset(); vi.mocked(recoverPassword).mockReset() })
function Destination() { const location = useLocation(); return <p role="status">{location.pathname}</p> }
function form(mode: 'login' | 'register', image?: File) {
  return render(<MemoryRouter initialEntries={[{ pathname: '/auth', state: { image } }]}><Routes><Route path="/auth" element={<Form mode={mode} />} /><Route path="*" element={<Destination />} /></Routes></MemoryRouter>)
}
function fill(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }) }
it('connecte et retrouve le dessin en cours', async () => {
  const image = new File(['dessin'], 'dessin.png', { type: 'image/png' })
  vi.mocked(authenticate).mockResolvedValue(undefined)
  const view = form('login', image)
  fill('Adresse e-mail', 'artiste@example.com'); fill('Mot de passe', 'dessin123!')
  fireEvent.submit(view.container.querySelector('form')!)
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('/mentorship'))
  expect(authenticate).toHaveBeenCalledWith('login', { email: 'artiste@example.com', password: 'dessin123!' })
})
it('inscrit avec le pseudo normalisé et les conditions acceptées', async () => {
  const view = form('register')
  fill('Pseudo', ' artiste '); fill('Adresse e-mail', 'artiste@example.com'); fill('Mot de passe', 'dessin123!')
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.submit(view.container.querySelector('form')!)
  await waitFor(() => expect(authenticate).toHaveBeenCalledWith('register', { username: 'artiste', email: 'artiste@example.com', password: 'dessin123!', acceptedTerms: true }))
})
it('refuse un pseudo vide et les conditions non acceptées', () => {
  const view = form('register')
  fill('Pseudo', '   ')
  fireEvent.submit(view.container.querySelector('form')!)
  expect(screen.getByRole('alert')).toHaveTextContent('Veuillez saisir votre pseudo.')
  fill('Pseudo', 'artiste')
  fireEvent.submit(view.container.querySelector('form')!)
  expect(screen.getByRole('alert')).toHaveTextContent('Vous devez accepter')
  expect(authenticate).not.toHaveBeenCalled()
})
it('affiche une erreur serveur et réactive le formulaire', async () => {
  vi.mocked(authenticate).mockRejectedValue(new Error('Connexion refusée'))
  const view = form('login')
  fireEvent.submit(view.container.querySelector('form')!)
  expect(await screen.findByRole('alert')).toHaveTextContent('Connexion refusée')
  expect(screen.getByRole('button')).toBeEnabled()
})
it('bloque les doubles soumissions pendant la connexion', async () => {
  let finish!: () => void
  vi.mocked(authenticate).mockReturnValue(new Promise<void>(resolve => { finish = resolve }))
  const view = form('login')
  fireEvent.submit(view.container.querySelector('form')!)
  fireEvent.submit(view.container.querySelector('form')!)
  expect(screen.getByRole('button')).toBeDisabled()
  expect(authenticate).toHaveBeenCalledTimes(1)
  finish()
  await screen.findByRole('status')
})
it('demande un lien et affiche le message de confirmation', async () => {
  vi.mocked(recoverPassword).mockResolvedValue('Vérifiez votre messagerie')
  const view = render(<MemoryRouter><PasswordRecovery mode="request" /></MemoryRouter>)
  fill('Adresse e-mail', 'artiste@example.com')
  fireEvent.submit(view.container.querySelector('form')!)
  expect(await screen.findByRole('status')).toHaveTextContent('Vérifiez votre messagerie')
  expect(recoverPassword).toHaveBeenCalledWith('request', { email: 'artiste@example.com' })
})
it.each(['', '#token=invalide'])('refuse un lien de réinitialisation invalide : %s', hash => {
  window.history.replaceState(null, '', `/reset-password${hash}`)
  render(<MemoryRouter><PasswordRecovery mode="reset" /></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Ce lien est invalide')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(recoverPassword).not.toHaveBeenCalled()
})
it('vérifie la confirmation puis transmet le token du fragment', async () => {
  const token = 'a'.repeat(64)
  window.history.replaceState(null, '', `/reset-password#token=${token}`)
  vi.mocked(recoverPassword).mockResolvedValue('Mot de passe modifié')
  const view = render(<MemoryRouter><PasswordRecovery mode="reset" /></MemoryRouter>)
  fill('Nouveau mot de passe', 'dessin123!'); fill('Confirmer le mot de passe', 'différent123!')
  fireEvent.submit(view.container.querySelector('form')!)
  expect(screen.getByRole('alert')).toHaveTextContent('Les mots de passe ne correspondent pas.')
  expect(recoverPassword).not.toHaveBeenCalled()
  fill('Confirmer le mot de passe', 'dessin123!')
  fireEvent.submit(view.container.querySelector('form')!)
  expect(await screen.findByRole('status')).toHaveTextContent('Mot de passe modifié')
  expect(recoverPassword).toHaveBeenCalledWith('reset', { token, password: 'dessin123!' })
})
