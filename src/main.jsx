import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.jsx'
import './styles/globals.css'

// Entrada de vite-react-ssg: en el build genera HTML estático por ruta pública
// (ver ssgOptions.includedRoutes en vite.config.js) y en el navegador hidrata la
// SPA. vite-react-ssg ya envuelve la app con HelmetProvider y el Router, así que
// aquí no montamos esos providers manualmente.
export const createRoot = ViteReactSSG({ routes })
