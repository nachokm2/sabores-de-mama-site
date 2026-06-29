import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import Home from './pages/Home' // landing (LCP) → eager para no diferir el primer render

// Code splitting: el resto de páginas se cargan bajo demanda (chunks separados).
const Nosotros      = lazy(() => import('./pages/Nosotros'))
const Menu          = lazy(() => import('./pages/Menu'))
const MealPrep      = lazy(() => import('./pages/MealPrep'))
const Cocinera      = lazy(() => import('./pages/Cocinera'))
const HornearEnCasa = lazy(() => import('./pages/HornearEnCasa'))
const ConsultarPedido = lazy(() => import('./pages/ConsultarPedido'))
const Galeria       = lazy(() => import('./pages/Galeria'))
const Contacto      = lazy(() => import('./pages/Contacto'))
const NotFound      = lazy(() => import('./pages/NotFound'))
const MealPrepFlow  = lazy(() => import('./pages/MealPrepFlow'))
const CocineraFlow  = lazy(() => import('./pages/CocineraFlow'))
const StepPayment   = lazy(() => import('./pages/StepPayment'))

// ── Portal de clientes (chunks aparte) ──
import ClientePrivateRoute from './components/cuenta/ClientePrivateRoute'
const ClienteLogin     = lazy(() => import('./pages/Cuenta/ClienteLogin'))
const ClienteRegistro  = lazy(() => import('./pages/Cuenta/ClienteRegistro'))
const ClienteRecuperar = lazy(() => import('./pages/Cuenta/ClienteRecuperar'))
const ClienteReset     = lazy(() => import('./pages/Cuenta/ClienteReset'))
const ClienteCuenta    = lazy(() => import('./pages/Cuenta/ClienteCuenta'))

// ── Panel admin (chunks aparte; no se cargan en el sitio público) ──
import PrivateRoute   from './components/admin/PrivateRoute'
const AdminLogin     = lazy(() => import('./pages/Admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminPedidos   = lazy(() => import('./pages/Admin/AdminPedidos'))
const AdminPlatos    = lazy(() => import('./pages/Admin/AdminPlatos'))
const AdminCupos     = lazy(() => import('./pages/Admin/AdminCupos'))
const AdminComunas   = lazy(() => import('./pages/Admin/AdminComunas'))
const AdminProductos = lazy(() => import('./pages/Admin/AdminProductos'))
const AdminHub       = lazy(() => import('./pages/Admin/AdminHub'))
import { isTokenValid } from './lib/adminApi'

// /admin → hub (elegir servicio) si hay sesión válida; si no, al login.
function AdminIndex() {
  return <Navigate to={isTokenValid() ? '/admin/hub' : '/admin/login'} replace />
}

/**
 * Gestiona el scroll en cambios de ruta:
 *  - Si la URL trae un hash (#seccion), hace scroll suave hasta el ancla
 *    (usando la instancia de Lenis para que respete el smooth scroll global).
 *  - Si no hay hash, vuelve al inicio de la página.
 * Esto permite que el Navbar enlace a secciones de otra página (p. ej.
 * /menu#servicio-mealprep) con desplazamiento suave.
 */
function ScrollManager({ lenisRef }) {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      // Esperar a que la página destino renderice antes de buscar el ancla.
      let tries = 0
      const tryScroll = () => {
        const el = document.getElementById(id)
        if (el) {
          const lenis = lenisRef.current
          if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.0 })
          else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (tries++ < 10) {
          requestAnimationFrame(tryScroll)
        }
      }
      requestAnimationFrame(tryScroll)
    } else {
      const lenis = lenisRef.current
      if (lenis) lenis.scrollTo(0, { immediate: true })
      else window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, hash, lenisRef])
  return null
}

function AppContent({ lenisRef }) {
  const navigate = useNavigate()

  // Los CTA del sitio ("Pedir ahora", "Agendar"…) disparan este evento vía
  // openChatBot(); ahora inicia el flujo de Meal Prep (SPA, sin recarga).
  useEffect(() => {
    const handler = () => navigate('/meal-prep')
    window.addEventListener('sabores:start-flow', handler)
    return () => window.removeEventListener('sabores:start-flow', handler)
  }, [navigate])

  return (
    <>
      <ScrollManager lenisRef={lenisRef} />
      <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/nosotros"  element={<Nosotros />} />
        <Route path="/menu"      element={<Menu />} />
        <Route path="/meal-prep-en-casa" element={<MealPrep />} />
        <Route path="/cocinera"  element={<Cocinera />} />
        <Route path="/healthy" element={<HornearEnCasa />} />
        <Route path="/consultar-pedido" element={<ConsultarPedido />} />
        <Route path="/galeria"   element={<Galeria />} />
        <Route path="/contacto"  element={<Contacto />} />

        {/* ── Flujos de pedido ── */}
        <Route path="/meal-prep"             element={<MealPrepFlow />} />
        <Route path="/cocinera-a-domicilio"  element={<CocineraFlow />} />
        <Route path="/pago/:pedidoId"        element={<StepPayment />} />

        {/* ── Portal de clientes ── */}
        <Route path="/cuenta/login"     element={<ClienteLogin />} />
        <Route path="/cuenta/registro"  element={<ClienteRegistro />} />
        <Route path="/cuenta/recuperar" element={<ClienteRecuperar />} />
        <Route path="/cuenta/reset"     element={<ClienteReset />} />
        <Route element={<ClientePrivateRoute />}>
          <Route path="/cuenta"         element={<ClienteCuenta />} />
        </Route>

        {/* ── Panel admin ── */}
        <Route path="/admin"           element={<AdminIndex />} />
        <Route path="/admin/login"     element={<AdminLogin />} />
        <Route element={<PrivateRoute />}>
          <Route path="/admin/hub"     element={<AdminHub />} />
          {/* Panel por servicio: /admin/:servicio/... (meal_prep | cocinera) */}
          <Route path="/admin/:servicio/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/:servicio/pedidos"   element={<AdminPedidos />} />
          <Route path="/admin/:servicio/platos"    element={<AdminPlatos />} />
          <Route path="/admin/:servicio/cupos"     element={<AdminCupos />} />
          <Route path="/admin/:servicio/comunas"   element={<AdminComunas />} />
          <Route path="/admin/:servicio/productos" element={<AdminProductos />} />
        </Route>

        <Route path="*"          element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  )
}

function App() {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })
    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return (
    <BrowserRouter>
      <AppContent lenisRef={lenisRef} />
    </BrowserRouter>
  )
}

export default App
