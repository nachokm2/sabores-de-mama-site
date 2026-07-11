import { useEffect, useState } from 'react'
import { subirImagen, ApiError } from '../../lib/adminApi'

/**
 * Modal bloqueante para subir la fotografía del pedido antes de marcarlo
 * "En delivery". Sube la imagen al bucket y devuelve su key vía onConfirm(key).
 * El cambio de estado lo aplica el componente padre (AdminPedidos).
 */
export default function FotoEntregaModal({ pedido, onConfirm, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  // Previsualización local del archivo elegido.
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onElegir = (e) => {
    setError('')
    setFile(e.target.files?.[0] || null)
  }

  const confirmar = async () => {
    if (!file || subiendo) return
    setSubiendo(true)
    setError('')
    try {
      const key = await subirImagen(file, 'entregas')
      await onConfirm(key)
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError('El almacenamiento de imágenes no está configurado. No se puede subir la foto.')
      } else {
        setError(err.message || 'No se pudo subir la foto. Intenta nuevamente.')
      }
      setSubiendo(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="foto-entrega-titulo"
    >
      <div className="bg-background-surface rounded-2xl border border-espresso/10 shadow-xl w-full max-w-md p-5">
        <h2 id="foto-entrega-titulo" className="font-display text-lg font-bold text-espresso mb-1">
          Foto del pedido #{pedido.id}
        </h2>
        <p className="text-sm text-warm-gray mb-4">
          Para marcar este pedido como <strong>En delivery</strong> debes subir una fotografía del
          pedido listo para salir.
        </p>

        <label className="block text-sm mb-3">
          <span className="block text-espresso font-medium mb-1.5">Fotografía *</span>
          <input
            type="file"
            accept="image/*"
            onChange={onElegir}
            disabled={subiendo}
            className="block w-full text-sm text-warm-gray file:mr-3 file:rounded-full file:border-0 file:bg-terracotta file:text-ivory file:font-semibold file:px-4 file:py-2 file:text-sm hover:file:bg-ember disabled:opacity-50"
          />
        </label>

        {preview && (
          <img
            src={preview}
            alt="Previsualización de la foto del pedido"
            className="w-full max-h-64 object-contain rounded-xl border border-espresso/10 mb-3 bg-background"
          />
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
            disabled={!file || subiendo}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {subiendo ? 'Subiendo…' : 'Subir y marcar En delivery'}
          </button>
        </div>
      </div>
    </div>
  )
}
