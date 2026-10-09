import { Link } from 'react-router-dom'
import '../styles/components/footer.scss'

const Footer = () => (
    <footer>
        <div className="footer-content">
            <div className="footer-columns">
                <nav aria-label="Informations et liens utiles">
                    <h2>Liens utiles</h2>

                    <ul>
                        <li>
                            <Link to="/legal#mentions-legales">
                                Mentions légales
                            </Link>
                        </li>
                        <li>
                            <Link to="/legal#confidentialite">
                                Confidentialité
                            </Link>
                        </li>
                        <li>
                            <Link to="/legal#conditions-utilisation">
                                Conditions d’utilisation
                            </Link>
                        </li>
                        <li>
                            <Link to="/legal#cookies">
                                Cookies et stockage local
                            </Link>
                        </li>
                        <li>
                            <Link to="/artists">
                                Communauté d’artistes
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="footer-contact">
                    <h2>Contact</h2>

                    <a href="mailto:kalon-mentor@gmail.com">
                        kalon-mentor@gmail.com
                    </a>

                    <Link to="/legal#contact">
                        Assistance
                    </Link>

                    <a
                        href="https://github.com/Shinemi/Kalon-Mentor"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub du projet ↗
                    </a>
                </div>

                <Link to="/" className="footer-brand">
                    <img
                        src="/Logo Kalon Mentor au trait noir.png"
                        alt="Kalon Mentor — Accueil"
                    />
                </Link>
            </div>

            <p className="copyright">
                © 2026 Kalon Mentor — Fait main pour l’âme digitale
            </p>
        </div>
    </footer>
)

export default Footer