import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getEncuesta, enviarEncuesta, ApiError } from '../lib/publicApi'

const COMENT_MAX = 500

/**
 * Encuesta de satisfacción (pública) enlazada desde el correo de "Entregado".
 * Ruta: /encuesta/:orderId/:token — el token valida el enlace en el backend.
 * Muy breve: estrellas (1–5), recomienda (Sí/No) y comentario opcional.
 */
export default function Encuesta() {
  const { orderId, token } = useParams()
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [recomienda, setRecomienda] = useState(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    let active = true
    getEncuesta(orderId, token)
      .then((d) => {
        if (!active) return
        setEstado(d)
        if (d?.yaRespondida) setEnviada(true)
      })
      .catch((err) => {
        if (!active) return
        setErrorCarga(
          err instanceof ApiError && err.status === 403
            ? 'El enlace de la encuesta no es válido o ya expiró.'
            : 'No pudimos cargar la encuesta. Intenta más tarde.'
        )
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [orderId, token])

  const enviar = async () => {
    if (rating < 1) {
      setError('Elige una calificación de 1 a 5 estrellas.')
      return
    }
    if (recomienda === null) {
      setError('Indícanos si nos recomendarías.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      await enviarEncuesta(orderId, {
        token,
        satisfaction_rating: rating,
        would_recommend: recomienda,
        improvement_comment: comentario.trim() || null,
      })
      setEnviada(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEnviada(true) // ya estaba respondida → mostramos el agradecimiento igual
      } else {
        setError(err.message || 'No se pudo enviar tu respuesta. Intenta nuevamente.')
        setEnviando(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <Helmet>
        <title>Encuesta de satisfacción · Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <a href="/" className="mb-6 font-display text-xl font-bold text-terracotta">
        Sabores de Mamá
      </a>

      <div className="w-full max-w-md bg-background-surface border border-espresso/10 rounded-3xl shadow-lg p-6 sm:p-8">
        {loading ? (
          <p className="text-warm-gray text-sm text-center py-8">Cargando…</p>
        ) : errorCarga ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3" aria-hidden="true">🔒</p>
            <p className="text-espresso font-semibold mb-1">Enlace no válido</p>
            <p className="text-warm-gray text-sm">{errorCarga}</p>
          </div>
        ) : enviada ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-3" aria-hidden="true">🙏</p>
            <h1 className="font-display text-2xl font-bold text-espresso mb-2">¡Gracias por tu opinión!</h1>
            <p className="text-warm-gray text-sm">Tu respuesta nos ayuda a seguir mejorando. ❤️</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-espresso mb-1">
              {estado?.nombre ? `${estado.nombre}, cuéntanos` : 'Cuéntanos'} tu experiencia
            </h1>
            <p className="text-warm-gray text-sm mb-6">Nos tomará menos de un minuto. ¡Gracias!</p>

            {/* 1 · Satisfacción */}
            <div className="mb-6">
              <p className="text-espresso font-medium text-sm mb-2">
                ¿Qué tan satisfecho(a) quedaste con nuestro servicio? *
              </p>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                    aria-pressed={rating === n}
                    className="text-4xl leading-none transition-transform hover:scale-110"
                  >
                    <span className={(hover || rating) >= n ? 'text-amber' : 'text-espresso/20'}>★</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2 · Recomendación */}
            <div className="mb-6">
              <p className="text-espresso font-medium text-sm mb-2">
                ¿Nos recomendarías a un familiar o amigo? *
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRecomienda(true)}
                  aria-pressed={recomienda === true}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    recomienda === true
                      ? 'border-terracotta bg-amber/10 text-espresso'
                      : 'border-espresso/15 text-warm-gray hover:border-terracotta/40'
                  }`}
                >
                  Sí 👍
                </button>
                <button
                  type="button"
                  onClick={() => setRecomienda(false)}
                  aria-pressed={recomienda === false}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    recomienda === false
                      ? 'border-terracotta bg-amber/10 text-espresso'
                      : 'border-espresso/15 text-warm-gray hover:border-terracotta/40'
                  }`}
                >
                  No 👎
                </button>
              </div>
            </div>

            {/* 3 · Comentario (opcional) */}
            <div className="mb-6">
              <label className="block text-espresso font-medium text-sm mb-2">
                ¿Qué podríamos mejorar? <span className="text-warm-gray font-normal">(opcional)</span>
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value.slice(0, COMENT_MAX))}
                rows={3}
                maxLength={COMENT_MAX}
                placeholder="Tu comentario nos ayuda mucho…"
                className="w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60 resize-none"
              />
              <p className="text-2xs text-warm-gray text-right mt-1">
                {comentario.length}/{COMENT_MAX}
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              onClick={enviar}
              disabled={enviando}
              className="w-full btn-primary justify-center disabled:opacity-50"
            >
              {enviando ? 'Enviando…' : 'Enviar mi opinión'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
