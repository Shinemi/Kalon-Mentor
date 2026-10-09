import { Routes, Route } from 'react-router-dom'
import Header from './components/header'
import Footer from './components/footer'
import Home from './pages/home'
import Login from './pages/login'
import Register from './pages/register'
import Profile from './pages/profile'
import Mentorship from './pages/mentorship'
import Courses from './pages/courses'
import NotFound from './pages/notFound'
import Legal from './pages/legal'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/mentorship' element={<Mentorship/>}/>
        <Route path='/courses' element={<Courses/>}/>
        <Route path='/*' element={<NotFound/>}/>
        <Route path='/legal' element={<Legal />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App

