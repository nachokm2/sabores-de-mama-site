import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import Home from './pages/Home' // landing (LCP) → eager para no diferir el primer render

// Helper para rutas con carga diferida (React Router data-router / vite-react-ssg).
// Nuestras páginas exportan el componente por defecto; lo mapeamos a `Component`.
// Usar el campo `lazy` (en lugar de React.lazy) permite además que vite-react-ssg
// detecte los CSS de cada chunk al pre-renderizar (evita el "flash" sin estilos).
const lazyRoute = (importer) => async () => ({ Component: (await importer()).default })

// ── Portal de clientes y admin: wrappers de sesión (eager, ligeros) ──
import ClientePrivateRoute from './components/cuenta/ClientePrivateRoute'
import PrivateRoute from './components/admin/PrivateRoute'
import { isTokenValid } from './lib/adminApi'

// /admin → hub (elegir servicio) si hay sesión válida; si no, al login.
function AdminIndex() {
  return <Navigate to={isTokenValid() ? '/admin/hub' : '/admin/login'} replace />
}

/**
 * Gestiona el scroll en cambios de ruta:
 *  - Si la URL trae un hash (#seccion), hace scroll suave hasta el ancla
 *    (usando la instancia de Lenis para respetar el smooth scroll global).
 *  - Si no hay hash, vuelve al inicio de la página.
 */
function ScrollManager({ lenisRef }) {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
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

/**
 * Layout raíz de toda la app: inicializa el smooth scroll (Lenis), gestiona el
 * scroll por ruta y escucha el evento de los CTA para iniciar el flujo de pedido.
 * Los efectos solo corren en el navegador → seguro para el pre-render (SSG).
 */
function RootLayout() {
  const lenisRef = useRef(null)
  const navigate = useNavigate()

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

  // Los CTA del sitio ("Pedir ahora", "Agendar"…) disparan este evento vía
  // openChatBot(); inicia el flujo de Meal Prep (SPA, sin recarga).
  useEffect(() => {
    const handler = () => navigate('/meal-prep')
    window.addEventListener('sabores:start-flow', handler)
    return () => window.removeEventListener('sabores:start-flow', handler)
  }, [navigate])

  return (
    <>
      <ScrollManager lenisRef={lenisRef} />
      <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
        <Outlet />
      </Suspense>
    </>
  )
}

/**
 * Rutas en formato data-router (compatible con react-router y con vite-react-ssg
 * para el pre-renderizado estático). Las rutas públicas de marketing se
 * pre-renderizan en el build (ver `ssgOptions.includedRoutes` en vite.config.js);
 * el resto (flujos, portal, admin, rutas con parámetros) se renderizan en el
 * cliente con el fallback SPA.
 */
export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/App.jsx',
    children: [
      // ── Páginas públicas (se pre-renderizan) ──
      { index: true, element: <Home /> },
      { path: 'nosotros', lazy: lazyRoute(() => import('./pages/Nosotros')) },
      { path: 'menu', lazy: lazyRoute(() => import('./pages/Menu')) },
      { path: 'meal-prep-en-casa', lazy: lazyRoute(() => import('./pages/MealPrep')) },
      { path: 'cocinera', lazy: lazyRoute(() => import('./pages/Cocinera')) },
      { path: 'healthy', lazy: lazyRoute(() => import('./pages/HornearEnCasa')) },
      { path: 'galeria', lazy: lazyRoute(() => import('./pages/Galeria')) },
      { path: 'contacto', lazy: lazyRoute(() => import('./pages/Contacto')) },
      // Landing pages de servicio (SEO local)
      { path: 'almuerzos-a-domicilio-santiago', lazy: lazyRoute(() => import('./pages/AlmuerzosDomicilio')) },
      { path: 'comida-para-empresas', lazy: lazyRoute(() => import('./pages/ComidaEmpresas')) },
      { path: 'preguntas-frecuentes', lazy: lazyRoute(() => import('./pages/PreguntasFrecuentes')) },
      // Landings por comuna (SEO local); las comunas válidas se pre-renderizan
      // (ver ssgOptions.includedRoutes); un slug desconocido redirige al home.
      { path: 'comida-a-domicilio/:comuna', lazy: lazyRoute(() => import('./pages/ComunaLanding')) },
      // Blog (Markdown pre-renderizado)
      { path: 'blog', lazy: lazyRoute(() => import('./pages/Blog')) },
      { path: 'blog/:slug', lazy: lazyRoute(() => import('./pages/BlogPost')) },

      // ── Utilidades y encuesta (solo cliente) ──
      { path: 'consultar-pedido', lazy: lazyRoute(() => import('./pages/ConsultarPedido')) },
      { path: 'encuesta/:orderId/:token', lazy: lazyRoute(() => import('./pages/Encuesta')) },

      // ── Flujos de pedido (solo cliente) ──
      { path: 'meal-prep', lazy: lazyRoute(() => import('./pages/MealPrepFlow')) },
      { path: 'cocinera-a-domicilio', lazy: lazyRoute(() => import('./pages/CocineraFlow')) },
      { path: 'pago/:pedidoId', lazy: lazyRoute(() => import('./pages/StepPayment')) },

      // ── Portal de clientes (solo cliente) ──
      { path: 'cuenta/login', lazy: lazyRoute(() => import('./pages/Cuenta/ClienteLogin')) },
      { path: 'cuenta/registro', lazy: lazyRoute(() => import('./pages/Cuenta/ClienteRegistro')) },
      { path: 'cuenta/recuperar', lazy: lazyRoute(() => import('./pages/Cuenta/ClienteRecuperar')) },
      { path: 'cuenta/reset', lazy: lazyRoute(() => import('./pages/Cuenta/ClienteReset')) },
      {
        element: <ClientePrivateRoute />,
        children: [
          { path: 'cuenta', lazy: lazyRoute(() => import('./pages/Cuenta/ClienteCuenta')) },
          { path: 'cuenta/lista', lazy: lazyRoute(() => import('./pages/Cuenta/ClienteListaCompras')) },
        ],
      },

      // ── Panel admin (solo cliente) ──
      { path: 'admin', element: <AdminIndex /> },
      { path: 'admin/login', lazy: lazyRoute(() => import('./pages/Admin/AdminLogin')) },
      {
        element: <PrivateRoute />,
        children: [
          { path: 'admin/hub', lazy: lazyRoute(() => import('./pages/Admin/AdminHub')) },
          { path: 'admin/:servicio/dashboard', lazy: lazyRoute(() => import('./pages/Admin/AdminDashboard')) },
          { path: 'admin/:servicio/pedidos', lazy: lazyRoute(() => import('./pages/Admin/AdminPedidos')) },
          { path: 'admin/:servicio/platos', lazy: lazyRoute(() => import('./pages/Admin/AdminPlatos')) },
          { path: 'admin/:servicio/cupos', lazy: lazyRoute(() => import('./pages/Admin/AdminCupos')) },
          { path: 'admin/:servicio/comunas', lazy: lazyRoute(() => import('./pages/Admin/AdminComunas')) },
          { path: 'admin/:servicio/productos', lazy: lazyRoute(() => import('./pages/Admin/AdminProductos')) },
          { path: 'admin/:servicio/ajustes', lazy: lazyRoute(() => import('./pages/Admin/AdminAjustes')) },
          { path: 'admin/:servicio/usuarios', lazy: lazyRoute(() => import('./pages/Admin/AdminUsuarios')) },
          { path: 'admin/:servicio/satisfaccion', lazy: lazyRoute(() => import('./pages/Admin/AdminSatisfaccion')) },
        ],
      },

      // ── 404 ──
      { path: '*', lazy: lazyRoute(() => import('./pages/NotFound')) },
    ],
  },
]

export default routes
