import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import Home from './pages/Home' // landing (LCP) → eager para no diferir el primer render
import { escucharClicsWhatsApp, metaTrack, primeraVezEnLaSesion } from './lib/metaPixel'

// Helper para rutas con carga diferida (React Router data-router / vite-react-ssg).
// Nuestras páginas exportan el componente por defecto; lo mapeamos a `Component`.
// Usar el campo `lazy` (en lugar de React.lazy) permite además que vite-react-ssg
// detecte los CSS de cada chunk al pre-renderizar (evita el "flash" sin estilos).
/**
 * Clave de sesión que marca que ya se recargó por un chunk que no cargó. Evita
 * el bucle infinito si el fallo es real y no un despliegue.
 */
const YA_RECARGO = 'sdm:recarga-por-chunk'

/**
 * Recarga UNA vez cuando un chunk no se puede cargar.
 *
 * Cada build renombra los archivos con un hash nuevo. Si alguien tiene el sitio
 * abierto y se despliega, su pestaña sigue pidiendo los nombres viejos, que ya no
 * existen: la navegación muere con "Failed to fetch dynamically imported module"
 * y —peor— como toda ruta del panel se sirve con index.html (el home
 * pre-renderizado), lo que queda en pantalla es el home estático y muerto.
 *
 * Recargar toma el index nuevo con los nombres nuevos y todo sigue. La marca en
 * sessionStorage garantiza que se intente una sola vez por pestaña: si tras
 * recargar el módulo TAMPOCO carga, el error se propaga y se ve, en vez de dejar
 * la pestaña recargándose para siempre.
 */
function esErrorDeChunk(err) {
  const msg = String(err?.message || err)
  return (
    /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg) ||
    err?.name === 'ChunkLoadError'
  )
}

const lazyRoute = (importer) => async () => {
  try {
    const mod = { Component: (await importer()).default }
    // Cargó bien: se limpia la marca para que un despliegue POSTERIOR en esta
    // misma pestaña también tenga su recarga. Sin esto, la primera recarga
    // gastaría el único intento de toda la sesión.
    try {
      sessionStorage.removeItem(YA_RECARGO)
    } catch {
      /* sin sessionStorage no hay nada que limpiar */
    }
    return mod
  } catch (err) {
    if (typeof window !== 'undefined' && esErrorDeChunk(err)) {
      let recargado = false
      try {
        recargado = sessionStorage.getItem(YA_RECARGO) === '1'
        if (!recargado) sessionStorage.setItem(YA_RECARGO, '1')
      } catch {
        /* sessionStorage bloqueado (modo privado estricto): se recarga igual una vez */
      }
      if (!recargado) {
        console.warn('[app] Un módulo no cargó (probablemente un despliegue nuevo). Recargando…')
        window.location.reload()
        // Promesa que nunca resuelve: evita que React Router pinte un error
        // mientras el navegador ya está recargando.
        return new Promise(() => {})
      }
    }
    throw err
  }
}

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
 * ViewContent (Meta) al llegar al menú.
 *
 * Se observa el cambio de ruta en vez de montarlo dentro de Menu.jsx porque en
 * una SPA hay dos formas de llegar: carga directa de /menu y navegación interna.
 * Aquí las dos pasan por el mismo sitio.
 *
 * Una sola vez por pestaña: sin eso, ir y volver al menú tres veces cuenta como
 * tres visualizaciones y el evento deja de significar "vio el menú".
 */
function MetaViewContentMenu() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname !== '/menu') return
    if (!primeraVezEnLaSesion('sdm:meta-viewcontent-menu')) return
    metaTrack('ViewContent', { content_name: 'Menu' })
  }, [pathname])
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

  // Contact (Meta) en cualquier clic a WhatsApp del sitio. Ver metaPixel.js.
  useEffect(() => escucharClicsWhatsApp(), [])

  return (
    <>
      <ScrollManager lenisRef={lenisRef} />
      <MetaViewContentMenu />
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
