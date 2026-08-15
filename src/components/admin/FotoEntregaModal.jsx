import { useEffect, useRef, useState } from 'react'
import { subirImagen, ApiError } from '../../lib/adminApi'

/**
 * Modal bloqueante para subir las fotografías del pedido antes de marcarlo
 * "En delivery". Sube las imágenes al bucket y devuelve sus keys vía
 * onConfirm(keys). El cambio de estado lo aplica el componente padre.
 *
 * Acepta VARIAS fotos: una sola no alcanzaba para mostrar un pedido de hasta 25
 * porciones. Se pueden ir agregando en tandas (elegir, agregar más) y quitar
 * antes de subir.
 */
export default function FotoEntregaModal({ pedido, onConfirm, onClose }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState({ hechas: 0, total: 0 })
  const [error, setError] = useState('')

  // Previsualización local. Se revocan las URLs al cambiar la lista para no
  // filtrar memoria del navegador.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  const onElegir = (e) => {
    setError('')
    const nuevos = Array.from(e.target.files || [])
    // Se ACUMULAN en vez de reemplazar: así se pueden agregar fotos en varias
    // tandas (el selector de archivos solo permite elegir dentro de una carpeta
    // a la vez). Se descartan las repetidas por nombre y tamaño.
    setFiles((prev) => {
      const clave = (f) => `${f.name}|${f.size}`
      const vistos = new Set(prev.map(clave))
      return [...prev, ...nuevos.filter((f) => !vistos.has(clave(f)))]
    })
    // Permite volver a elegir el mismo archivo si se quitó de la lista.
    e.target.value = ''
  }

  const quitar = (i) => setFiles((prev) => prev.filter((_, j) => j !== i))

  const confirmar = async () => {
    if (!files.length || subiendo) return
    setSubiendo(true)
    setError('')
    setProgreso({ hechas: 0, total: files.length })
    try {
      // Secuencial a propósito: cada subida es un PUT directo al bucket y así el
      // progreso es real y no se saturan la red ni el presign en un pedido con
      // muchas fotos.
      const keys = []
      for (const f of files) {
        keys.push(await subirImagen(f, 'entregas'))
        setProgreso((p) => ({ ...p, hechas: p.hechas + 1 }))
      }
      await onConfirm(keys)
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError('El almacenamiento de imágenes no está configurado. No se pueden subir las fotos.')
      } else {
        setError(err.message || 'No se pudieron subir las fotos. Intenta nuevamente.')
      }
      setSubiendo(false)
    }
  }

  const etiquetaBoton = subiendo
    ? progreso.total > 1
      ? `Subiendo ${progreso.hechas + 1} de ${progreso.total}…`
      : 'Subiendo…'
    : `Subir ${files.length || ''} ${files.length === 1 ? 'foto' : 'fotos'} y marcar En delivery`.replace(/\s+/g, ' ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="foto-entrega-titulo"
    >
      <div className="bg-background-surface rounded-2xl border border-espresso/10 shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h2 id="foto-entrega-titulo" className="font-display text-lg font-bold text-espresso mb-1">
          Fotos del pedido #{pedido.id}
        </h2>
        <p className="text-sm text-warm-gray mb-4">
          Para marcar este pedido como <strong>En delivery</strong> debes subir al menos una
          fotografía del pedido listo para salir. Puedes agregar varias.
        </p>

        <div className="text-sm mb-3">
          <span className="block text-espresso font-medium mb-1.5">
            Fotografías *{' '}
            {files.length > 0 && (
              <span className="text-warm-gray font-normal">
                ({files.length} {files.length === 1 ? 'elegida' : 'elegidas'})
              </span>
            )}
          </span>
          {/*
            El input va OCULTO y se abre desde el botón. Es necesario porque
            `onElegir` limpia su valor para poder volver a elegir un archivo que
            se quitó de la lista, y el navegador entonces escribe "No file
            chosen" junto al control: contradecía al contador de al lado y
            parecía que no se había seleccionado nada.
          */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onElegir}
            disabled={subiendo}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="rounded-full bg-terracotta text-ivory font-semibold px-4 py-2 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {files.length ? 'Agregar más fotos' : 'Elegir fotos'}
          </button>
        </div>

        {/*
          `object-contain` y no `object-cover`: con recorte, una foto vertical o
          panorámica mostraba solo una franja del centro y no se reconocía lo que
          se había elegido, que es justo para lo que sirve la previsualización.
          Con una sola foto se muestra grande, como antes de admitir varias.
        */}
        {previews.length > 0 && (
          <ul className={previews.length === 1 ? 'mb-3' : 'grid grid-cols-3 gap-2 mb-3'}>
            {previews.map((url, i) => (
              <li key={url} className="relative">
                <img
                  src={url}
                  alt={`Previsualización ${i + 1}`}
                  className={`w-full object-contain rounded-lg border border-espresso/10 bg-background ${
                    previews.length === 1 ? 'max-h-64' : 'h-28'
                  }`}
                />
                {!subiendo && (
                  <button
                    onClick={() => quitar(i)}
                    aria-label={`Quitar foto ${i + 1}`}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-espresso text-ivory text-xs leading-none flex items-center justify-center hover:bg-ember"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="mb-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end items-center gap-3 mt-2">
          <button
            onClick={onClose}
            disabled={subiendo}
            className="text-sm text-warm-gray hover:text-espresso px-3 py-2 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!files.length || subiendo}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {etiquetaBoton}
          </button>
        </div>
      </div>
    </div>
  )
}
