import { S3Client, PutObjectCommand, PutBucketCorsCommand, PutBucketAclCommand } from '@aws-sdk/client-s3'
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

// Intenta dejar el bucket como public-read (para que las fotos se vean sin
// firmar). Idempotente; si Tigris exige verificación de pago o las credenciales
// no tienen permiso, se registra y hay que activarlo manualmente.
let publicPromise = null
export function ensureBucketPublic() {
  if (publicPromise) return publicPromise
  publicPromise = (async () => {
    const s3 = getClient()
    if (!s3) return
    try {
      await s3.send(new PutBucketAclCommand({ Bucket: process.env.S3_BUCKET, ACL: 'public-read' }))
      console.log('[storage] Bucket configurado como public-read.')
    } catch (e) {
      console.error(
        '[storage] No se pudo hacer el bucket público automáticamente ' +
          '(actívalo en Tigris → Settings → public-read):',
        e.message
      )
    }
  })()
  return publicPromise
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
  // Configura el bucket (CORS para el PUT + lectura pública) la primera vez.
  await Promise.all([ensureBucketCors(), ensureBucketPublic()])
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
