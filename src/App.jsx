import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Lenis from 'lenis'
import Home      from './pages/Home'
import Nosotros  from './pages/Nosotros'
import Menu      from './pages/Menu'
import Galeria   from './pages/Galeria'
import Contacto  from './pages/Contacto'
import NotFound  from './pages/NotFound'
import ChatBot   from './components/ui/ChatBot'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/nosotros"  element={<Nosotros />} />
        <Route path="/menu"      element={<Menu />} />
        <Route path="/galeria"   element={<Galeria />} />
        <Route path="/contacto"  element={<Contacto />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>
    </>
  )
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [])

  return (
    <BrowserRouter>
      <AppContent />
      <ChatBot />
    </BrowserRouter>
  )
}

export default App
