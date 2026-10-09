import { Link } from 'react-router-dom'
import '../styles/components/footer.scss'

const Footer = () => (
    <footer>
        <div className="footer-content">

            <h2>Kalon Mentor</h2>

            <nav>
                <ul>
                    <li>
                        <Link to="/legal#mentions-legales">
                            Mentions légales
                        </Link>
                    </li>
                    <li>
                        <Link to="/legal#confidentialite">
                            Politique de confidentialité
                        </Link>
                    </li>
                    <li>
                        <Link to="/legal#conditions-utilisation">
                            Conditions d’utilisation
                        </Link>
                    </li>
                    <li>
                        <Link to="/artists">
                            Communauté d’artistes
                        </Link>
                    </li>
                    <li>
                        <Link to="/legal#contact">
                            Assistance
                        </Link>
                    </li>
                </ul>
            </nav>

            <p className="copyright">© 2026 Kalon Mentor - Fait main pour l'âme digitale</p>

        </div>
    </footer>
)

export default Footer