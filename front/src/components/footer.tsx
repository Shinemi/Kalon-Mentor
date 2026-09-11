import { Link } from 'react-router-dom'
import '../styles/components/footer.scss'

const Footer = () => (
    <footer>
        <div className="footer-content">

            <h2>Kalon Mentor</h2>

            <ul>
                <li><Link to="/privacy">Privacy policy</Link></li>
                <li><Link to="/termsArt">Terms of art</Link></li>
                <li><Link to="/artists">Artist Guild</Link></li>
                <li><Link to="/support">Support</Link></li>
            </ul>

            <p className="copyright">© 2026 Kalon Mentor Handcrafted for the digital soul</p>

        </div>
    </footer>
)

export default Footer