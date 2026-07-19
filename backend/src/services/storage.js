import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Almacenamiento de imágenes en un bucket S3-compatible (Tigris).
 * Config por variables de entorno:
 *   S3_ENDPOINT, S3_REGION (auto), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *   S3_BUCKET, S3_PUBLIC_BASE_URL (URL pública para LEER los objetos).
 *
 * Sube por presigned URL: el backend firma la subida y el navegador hace el PUT
 * directo al bucket (las credenciales nunca salen del backend).
 */
let client = null

function getClient() {
  if (client) return client
  const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET } = process.env
  if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET) return null
  client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: S3_ENDPOINT,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    // Path-style por defecto (Tigris lo usa). Sólo virtual-hosted si se pide explícito.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  })
  return client
}

export function storageConfigured() {
  return Boolean(getClient())
}

// Configura el CORS del bucket una sola vez (permite el PUT directo del navegador
// desde el frontend). Idempotente; si las credenciales no tienen permiso, se
// registra y se debe configurar manualmente.
let corsPromise = null
export function ensureBucketCors() {
  if (corsPromise) return corsPromise
  corsPromise = (async () => {
    const s3 = getClient()
    if (!s3) return
    const origins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || '*')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    try {
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: process.env.S3_BUCKET,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: origins,
                AllowedMethods: ['PUT', 'GET', 'HEAD'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        })
      )
      console.log(`[storage] CORS del bucket configurado para: ${origins.join(', ')}`)
    } catch (e) {
      console.error(
        '[storage] No se pudo configurar el CORS del bucket automáticamente ' +
          '(configúralo a mano si las subidas fallan):',
        e.message
      )
    }
  })()
  return corsPromise
}

function sanitize(name) {
  const clean = String(name || 'archivo')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return clean.slice(-80) || 'archivo'
}

/**
 * Genera una URL firmada para subir (PUT) y la URL pública para leer el objeto.
 */
export async function presignUpload({ filename, contentType, prefix = 'uploads' }) {
  const s3 = getClient()
  if (!s3) {
    const err = new Error('Almacenamiento de imágenes no configurado.')
    err.status = 503
    throw err
  }
  // Configura el CORS del bucket la primera vez (para el PUT del navegador).
  // La lectura no necesita bucket público: se sirve por presigned GET (Plan B).
  await ensureBucketCors()
  const key = `${prefix}/${Date.now()}-${sanitize(filename)}`
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  })
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 })
  const base = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const publicUrl = base ? `${base}/${key}` : uploadUrl.split('?')[0]
  return { key, uploadUrl, publicUrl }
}

/**
 * URL firmada para LEER un objeto (Plan B: el bucket no es público).
 * - `expiresIn` largo (7 días) para que la URL firmada siga válida mientras el
 *   navegador tenga cacheado el redirect del proxy.
 * - `ResponseCacheControl` hace que S3/Tigris devuelva un `Cache-Control` en la
 *   respuesta de la imagen, para que el navegador la cachee (antes no traía
 *   ninguno → se re-descargaba en cada visita).
 */
export async function presignGet(key, expiresIn = 604800) {
  const s3 = getClient()
  if (!s3) {
    const err = new Error('Almacenamiento de imágenes no configurado.')
    err.status = 503
    throw err
  }
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseCacheControl: 'public, max-age=86400',
  })
  return getSignedUrl(s3, cmd, { expiresIn })
}
