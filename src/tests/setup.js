// Setup global de los tests (jsdom).
// Aporta los matchers de jest-dom y polyfills de las APIs del navegador que
// usan los componentes/hocks (matchMedia, IntersectionObserver, ResizeObserver,
// scroll) y que jsdom no implementa. Sin esto, hooks como useReducedMotion o las
// animaciones de framer-motion/GSAP harían fallar el render en el entorno de test.
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpia el DOM entre tests para garantizar independencia (cada test parte limpio).
afterEach(() => {
  cleanup()
})

// window.matchMedia (usado por useReducedMotion).
// Se define como función plana (no vi.fn) para que no la afecte el reseteo de
// mocks entre tests y siempre devuelva un MediaQueryList válido.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// IntersectionObserver (usado por framer-motion whileInView)
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
if (!window.IntersectionObserver) {
  window.IntersectionObserver = IntersectionObserverMock
  global.IntersectionObserver = IntersectionObserverMock
}

// ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverMock
  global.ResizeObserver = ResizeObserverMock
}

// scroll APIs (usadas por GSAP/Lenis/handlers). jsdom las define pero lanzan
// "Not implemented"; las sobreescribimos siempre con no-ops para silenciar ruido.
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}
