import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  })
  return client
}

export function storageConfigured() {
  return Boolean(getClient())
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
