import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import '../styles/components/header.scss'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header>
        <div className="header-content">
            <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
                <img src="/front/public/ChatGPT Image 7 août 2026, 11_26_16.png" alt="Logo Kalon Mentor" />
            </Link>

            <nav>
                <button
                    className="burger-menu"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>

                <ul className={isOpen ? 'navbar-links open' : 'navbar-links'}>
                    <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
                    <li><Link to="/mentorship" onClick={() => setIsOpen(false)}>Mentorship</Link></li>
                    <li><Link to="/courses" onClick={() => setIsOpen(false)}>Courses</Link></li>
                    <li><Link to="/gallery" onClick={() => setIsOpen(false)}>Gallery</Link></li>
                </ul>
            </nav>
      </div>
    </header>
  )
}

export default Navbar