import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import { presignUpload, presignGet, storageConfigured } from '../services/storage.js'

const router = Router()

/**
 * GET /api/uploads/file?key=...  (público)
 * Redirige (302) a una URL firmada de lectura. Permite servir imágenes de un
 * bucket privado sin exponer credenciales ni necesitar acceso público.
 */
router.get('/file', async (req, res, next) => {
  try {
    const key = req.query.key
    if (!key) return res.status(400).json({ error: 'key es obligatorio.' })
    const url = await presignGet(String(key))
    return res.redirect(302, url)
  } catch (err) {
    if (err.status === 503) return res.status(404).end()
    next(err)
  }
})

/** GET /api/uploads/config (protegido) — ¿hay almacenamiento configurado? */
router.get('/config', authJWT, (req, res) => {
  res.json({ enabled: storageConfigured() })
})

/**
 * POST /api/uploads/presign  (protegido)
 * Body: { filename, contentType, prefix? }
 * Devuelve { uploadUrl, publicUrl } para subir el archivo directo al bucket.
 */
router.post('/presign', authJWT, async (req, res, next) => {
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
