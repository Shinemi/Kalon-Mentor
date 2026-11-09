import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Mentorship from './pages/Mentorship'
import Courses from './pages/Courses'
import NotFound from './pages/NotFound'
import Legal from './pages/Legal'
import Gallery from './pages/Gallery'
import CookieBanner from './components/CookieBanner'
import PasswordRecovery from './pages/PasswordRecovery'
import Seo from './components/Seo'
import Admin from './pages/Admin'

function App() {
    return (
        <>
            <Seo />
            <Header />
            <CookieBanner />
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/mentorship' element={<Mentorship />} />
                <Route path='/courses' element={<Courses />} />
                <Route path='/*' element={<NotFound />} />
                <Route path='/legal' element={<Legal />} />
                <Route path='/gallery' element={<Gallery />} />
                <Route path="/forgot-password" element={<PasswordRecovery key="request" mode="request" />} />
                <Route path="/reset-password" element={<PasswordRecovery key="reset" mode="reset" />} />
                <Route path="/klmt/users" element={<Admin view="users" />} />
                <Route path="/klmt/ai" element={<Admin view="ai" />} />
                <Route path="/klmt/courses" element={<Admin view="courses" />} />
            </Routes>
            <Footer />
        </>
    )
}

export default App
