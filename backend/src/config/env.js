import 'dotenv/config';

/**
 * Configuracion central del backend.
 * Todos los valores tienen un default razonable para que el sistema
 * pueda levantarse sin ningun archivo .env presente.
 */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  jwtSecret: process.env.JWT_SECRET ?? 'kiosky-secreto-de-desarrollo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',

  db: {
    // 'auto'   -> intenta MySQL y cae a memoria si no responde
    // 'mysql'  -> exige MySQL, falla si no conecta
    // 'memory' -> usa siempre el repositorio en memoria
    mode: process.env.DB_MODE ?? 'auto',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'kiosky',
  },

  // RF-13 / dashboard: ventana para la alerta de vencimiento proximo
  diasProximoVencimiento: Number(process.env.DIAS_PROXIMO_VENCIMIENTO ?? 30),
};

/**
 * Valores que son claramente relleno y no secretos. Se rechazan aunque
 * tengan el largo minimo, porque aparecen en ejemplos y tutoriales.
 */
const SECRETOS_DE_RELLENO = new Set([
  'kiosky-secreto-de-desarrollo',
  'secret',
  'secret-key',
  'cambiar',
  'changeme',
  'password',
]);

const LARGO_MINIMO_DEL_SECRETO = 32;

/**
 * En produccion, un secreto debil permite que cualquiera que lea el
 * repositorio firme sesiones validas y entre como propietario. Antes que
 * arrancar con esa puerta abierta, el servidor se niega a arrancar.
 *
 * En desarrollo se permite el valor por defecto, para que el sistema pueda
 * levantarse sin configurar nada.
 */
export function validarSecretoDeSesion(
  secreto = process.env.JWT_SECRET,
  entorno = process.env.NODE_ENV
) {
  if (entorno !== 'production') return;

  if (!secreto) {
    throw new Error('Falta JWT_SECRET. Genere uno con: openssl rand -hex 32');
  }
  if (secreto.length < LARGO_MINIMO_DEL_SECRETO) {
    throw new Error(
      `JWT_SECRET es demasiado corto (${secreto.length} caracteres). ` +
        `Se requieren al menos ${LARGO_MINIMO_DEL_SECRETO}.`
    );
  }
  if (SECRETOS_DE_RELLENO.has(secreto.trim().toLowerCase())) {
    throw new Error(
      'JWT_SECRET es un valor de relleno. Genere uno con: openssl rand -hex 32'
    );
  }
}
