
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import '../styles/pages/notFound.scss'

const NotFound = () => {

  return (
    <main className='notFound-main'>
      
        <h1 className="handwritten">Erreur <span>404</span> - Not Found</h1>

        <Link to="/home" className="button-primary">Retourner à l'accueil <ArrowRight aria-hidden="true" /></Link>

    </main> 
  )
}

export default NotFound