import { Routes, Route } from 'react-router-dom'
import Header from './components/header'
import Footer from './components/footer'
import Home from './pages/home'
import NotFound from './pages/notFound'

function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/*' element={<NotFound/>}/>
      </Routes>
      <Footer />
    </>
  )
}

export default App