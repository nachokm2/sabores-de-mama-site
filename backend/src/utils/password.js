import bcrypt from 'bcryptjs'

/**
 * Coste de bcrypt. Sube de 10 a 12: cada punto DUPLICA el trabajo necesario para
 * probar una contraseña, así que 12 encarece un ataque por fuerza bruta contra
 * los hashes cuatro veces respecto de 10, a cambio de ~200 ms al iniciar sesión.
 *
 * Los hashes existentes siguen siendo válidos: bcrypt guarda su propio coste en
 * el hash y `compare` lo respeta. Las cuentas viejas se quedan en 10 hasta que
 * cambien su contraseña; las nuevas nacen en 12.
 */
export const BCRYPT_COSTE = Number(process.env.BCRYPT_COSTE) || 12

export function hashPassword(plano) {
  return bcrypt.hash(String(plano), BCRYPT_COSTE)
}
