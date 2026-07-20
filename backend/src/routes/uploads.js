import { Router } from 'express'
import sharp from 'sharp'
import { requireAdmin } from '../middleware/authJWT.js'
import { presignUpload, presignGet, storageConfigured } from '../services/storage.js'

const router = Router()

// Extensiones que optimizamos al vuelo. Los demás (videos, etc.) van por redirect
// directo a S3 (para conservar streaming/range).
const IMG_EXT = /\.(jpe?g|png|webp)$/i
const DEFAULT_WIDTH = 1600
const MAX_WIDTH = 2560

// Caché en memoria de las imágenes ya optimizadas (LRU simple). Evita re-procesar
// la misma imagen en cada request. Las imágenes optimizadas pesan ~100–200 KB.
const CACHE_MAX = 80
const cache = new Map() // `${key}|${w}` -> Buffer (webp)
function cacheGet(k) {
  const v = cache.get(k)
  if (v) {
    cache.delete(k)
    cache.set(k, v) // "toca" la entrada (LRU)
  }
  return v
}
function cacheSet(k, v) {
  cache.set(k, v)
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
}

// Redirect directo a la URL firmada (para no-imágenes o como fallback).
async function redirectFirmado(res, key) {
  const url = await presignGet(String(key))
  res.set('Cache-Control', 'public, max-age=86400')
  return res.redirect(302, url)
}

/**
 * GET /api/uploads/file?key=...&w=1600  (público)
 * Sirve imágenes de un bucket privado. Para imágenes las OPTIMIZA al vuelo
 * (redimensiona a `w` y convierte a WebP, ~90% menos peso). Si algo falla, cae a
 * un redirect 302 a la URL firmada. Los videos/otros van siempre por redirect.
 */
router.get('/file', async (req, res, next) => {
  const key = req.query.key
  if (!key) return res.status(400).json({ error: 'key es obligatorio.' })
  const keyStr = String(key)

  try {
    if (!IMG_EXT.test(keyStr)) {
      // No es imagen (video, etc.): redirect directo (soporta range/streaming).
      return await redirectFirmado(res, keyStr)
    }

    const w = Math.min(Math.max(parseInt(req.query.w, 10) || DEFAULT_WIDTH, 16), MAX_WIDTH)
    const cacheKey = `${keyStr}|${w}`

    let out = cacheGet(cacheKey)
    if (!out) {
      const url = await presignGet(keyStr)
      const r = await fetch(url, { redirect: 'follow' })
      if (!r.ok) throw new Error(`origen respondió ${r.status}`)
      const buf = Buffer.from(await r.arrayBuffer())
      out = await sharp(buf)
        .rotate() // respeta la orientación EXIF
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer()
      cacheSet(cacheKey, out)
    }

    res.set('Content-Type', 'image/webp')
    res.set('Cache-Control', 'public, max-age=86400')
    return res.send(out)
  } catch (err) {
    // Fallback: si la optimización falla, intentar el redirect directo a S3.
    try {
      return await redirectFirmado(res, keyStr)
    } catch (err2) {
      if (err2.status === 503 || err.status === 503) return res.status(404).end()
      return next(err2)
    }
  }
})

/** GET /api/uploads/config (protegido) — ¿hay almacenamiento configurado? */
router.get('/config', requireAdmin, (req, res) => {
  res.json({ enabled: storageConfigured() })
})

/**
 * POST /api/uploads/presign  (protegido)
 * Body: { filename, contentType, prefix? }
 * Devuelve { uploadUrl, publicUrl } para subir el archivo directo al bucket.
 */
router.post('/presign', requireAdmin, async (req, res, next) => {
  try {
    const { filename, contentType, prefix } = req.body || {}
    if (!contentType) return res.status(400).json({ error: 'contentType es obligatorio.' })
    const data = await presignUpload({ filename, contentType, prefix: prefix || 'productos-hornear' })
    return res.json(data)
  } catch (err) {
    if (err.status === 503) return res.status(503).json({ error: err.message })
    next(err)
  }
})

export default router
