import Form from '../components/form'
import '../styles/pages/register.scss'

const Register = () => {
    return (
        <main className="register-page auth-page">
            <div className="auth-heading">
                <h1>Créer un compte</h1>
                <p>« Le premier trait est le plus difficile. »</p>
            </div>
            <Form mode="register" />
        </main>
    )
}

export default Register
