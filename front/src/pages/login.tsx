import Form from '../components/form'

const Login = () => {
    return (
        <main className="login-page auth-page">
            <div className="auth-heading">
                <h1>Connexion</h1>
                <p>« Le premier trait est le plus difficile. »</p>
            </div>
            <Form mode="login" />
        </main>
    )
}

export default Login
