import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import { presignUpload, storageConfigured } from '../services/storage.js'

const router = Router()

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
