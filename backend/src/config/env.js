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
