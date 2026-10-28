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
import Gallery from './pages/gallery'
import CookieBanner from './components/CookieBanner'

function App() {
  return (
    <>
      <Header />
      <CookieBanner/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/mentorship' element={<Mentorship/>}/>
        <Route path='/courses' element={<Courses/>}/>
        <Route path='/*' element={<NotFound/>}/>
        <Route path='/legal' element={<Legal />} />
        <Route path='/gallery' element={<Gallery/>}/>
      </Routes>
      <Footer />
    </>
  )
}

export default App

