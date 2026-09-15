import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SECCIONES, TERMINOS_FECHA_LARGA, TERMINOS_RUTA, TERMINOS_VERSION } from '../../data/terminos'

/**
 * Lectura de los Términos y Condiciones DENTRO del flujo de pedido.
 *
 * Por qué un modal y no el enlace a la página: el pedido vive en el estado del
 * componente (no se persiste), así que sacar al cliente del flujo para leer es
 * pedirle que arriesgue los 6 pasos que ya completó. Acá lee sin moverse.
 *
 * Y por qué exigir el scroll hasta el final: el requisito es que el cliente lea
 * los términos antes de enviar, no que pueda marcar una casilla. Un botón que se
 * habilita al abrir el modal se puede pulsar sin haber visto nada; uno que se
 * habilita al llegar al final obliga al menos a recorrer el documento —que es lo
 * máximo que un navegador puede constatar—, y deja la sección de horarios en el
 * camino en vez de escondida detrás de un enlace que nadie abre.
 *
 * El texto sale de `src/data/terminos.js`: el mismo del que se lee la versión que
 * se guarda con el pedido, así que lo que el cliente lee acá y lo que queda
 * registrado no pueden separarse.
 */

// Margen de tolerancia del "llegó al final": los navegadores redondean
// scrollTop a subpíxeles y en zoom/pantallas HiDPI la suma nunca da exacta.
const MARGEN_FINAL = 24

function Bloque({ bloque }) {
  if (bloque.destacado) {
    return (
      <p className="text-sm text-espresso leading-relaxed bg-amber/[0.10] border-l-2 border-terracotta rounded-r-lg px-3.5 py-2.5">
        {bloque.destacado}
      </p>
    )
  }
  if (bloque.lista) {
    return (
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-gray leading-relaxed">
        {bloque.lista.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="text-sm text-warm-gray leading-relaxed">{bloque.p}</p>
}

export default function TerminosModal({ abierto, onCerrar, onLeido }) {
  const contenidoRef = useRef(null)
  const cerrarRef = useRef(null)
  const [finAlcanzado, setFinAlcanzado] = useState(false)

  /**
   * ¿Se llegó al final? Si el documento NO desborda su contenedor (pantalla muy
   * alta, zoom reducido) ya está todo a la vista y exigir un scroll que no existe
   * dejaría el botón muerto para siempre.
   */
  const revisarFinal = useCallback(() => {
    const el = contenidoRef.current
    if (!el) return
    const cabeEntero = el.scrollHeight <= el.clientHeight + MARGEN_FINAL
    const llegoAlFinal = el.scrollHeight - el.scrollTop - el.clientHeight <= MARGEN_FINAL
    if (cabeEntero || llegoAlFinal) setFinAlcanzado(true)
  }, [])

  // La medición va en un efecto de LAYOUT, no en uno normal ni en un rAF: corre
  // en el mismo commit en que el texto entra al DOM, antes de pintar. Si se
  // difiere, el botón nace deshabilitado un frame de más incluso cuando el
  // documento cabe entero en pantalla y no hay nada que desplazar.
  useLayoutEffect(() => {
    if (!abierto) return
    setFinAlcanzado(false)
    revisarFinal()
  }, [abierto, revisarFinal])

  // Al abrir: bloquear el scroll de la página y poner el foco dentro del modal
  // (si no, el teclado seguiría navegando el formulario de atrás).
  useEffect(() => {
    if (!abierto) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar?.()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previo
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-espresso/60 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminos-modal-titulo"
        className="bg-background-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-espresso/10">
          <div>
            <h2 id="terminos-modal-titulo" className="font-display text-lg font-bold text-espresso">
              Términos y Condiciones del servicio
            </h2>
            <p className="text-xs text-warm-gray mt-0.5">
              Versión {TERMINOS_VERSION} · Vigente desde el {TERMINOS_FECHA_LARGA}
            </p>
          </div>
          <button
            ref={cerrarRef}
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-warm-gray hover:text-espresso text-xl leading-none px-2 py-1 rounded-lg flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Texto (el scroll de ESTE contenedor es el que habilita el botón) */}
        <div
          ref={contenidoRef}
          onScroll={revisarFinal}
          data-testid="terminos-contenido"
          className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5 flex-1"
        >
          {SECCIONES.map((s) => (
            <section key={s.id} aria-labelledby={`modal-${s.id}`}>
              <h3 id={`modal-${s.id}`} className="font-display text-base font-bold text-espresso mb-2">
                {s.titulo}
              </h3>
              <div className="space-y-2.5">
                {s.bloques.map((bloque, i) => (
                  <Bloque key={i} bloque={bloque} />
                ))}
              </div>
            </section>
          ))}
          <p className="text-xs text-warm-gray pt-2 border-t border-espresso/10">
            Llegaste al final. Si quieres guardarlos o imprimirlos, puedes{' '}
            <a
              href={TERMINOS_RUTA}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta underline underline-offset-2"
            >
              abrirlos en una página aparte
            </a>
            .
          </p>
        </div>

        {/* Pie */}
        <div className="px-5 sm:px-6 py-4 border-t border-espresso/10 bg-background-warm flex items-center justify-between gap-4">
          <p className="text-xs text-warm-gray">
            {finAlcanzado ? 'Ya puedes confirmar la lectura.' : 'Desplázate hasta el final para continuar.'}
          </p>
          <button
            onClick={onLeido}
            disabled={!finAlcanzado}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            He leído los términos
          </button>
        </div>
      </div>
    </div>
  )
}
