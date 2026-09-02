import mysql from 'mysql2/promise';
import { config } from './env.js';

/**
 * Estado de la conexion resuelto en el arranque.
 *   mode: 'mysql' | 'memory'
 *   pool: pool de mysql2 cuando mode === 'mysql', null en caso contrario
 */
let estado = { mode: 'memory', pool: null };

/**
 * Intenta establecer la conexion con MySQL segun config.db.mode.
 *
 * - 'memory' -> no intenta conectar.
 * - 'mysql'  -> exige conexion; si falla, propaga el error.
 * - 'auto'   -> intenta conectar y, si falla, cae al repositorio en
 *               memoria dejando constancia del motivo por consola.
 */
export async function inicializarBaseDeDatos() {
  if (config.db.mode === 'memory') {
    estado = { mode: 'memory', pool: null };
    return estado;
  }

  try {
    const pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      // Necesario para que las transacciones de venta sean atomicas
      multipleStatements: false,
    });

    const conexion = await pool.getConnection();
    await conexion.ping();
    conexion.release();

    estado = { mode: 'mysql', pool };
    return estado;
  } catch (error) {
    if (config.db.mode === 'mysql') {
      throw new Error(
        `No se pudo conectar a MySQL (${config.db.host}:${config.db.port}/${config.db.database}): ${error.message}`
      );
    }

    console.warn(
      `[kiosky] MySQL no disponible (${error.code ?? error.message}). ` +
        'Se inicia en modo memoria con el juego de datos de database/seed.sql.'
    );
    estado = { mode: 'memory', pool: null };
    return estado;
  }
}

export function getEstadoBaseDeDatos() {
  return estado;
}

/** Pool de MySQL. Lanza si el sistema no esta corriendo contra MySQL. */
export function getPool() {
  if (!estado.pool) {
    throw new Error('El sistema no esta conectado a MySQL (modo memoria activo).');
  }
  return estado.pool;
}

/**
 * Ejecuta un callback dentro de una transaccion.
 * Usado por VentaService y StockService para que descontar stock y
 * registrar el movimiento sea una sola operacion atomica.
 */
export async function conTransaccion(callback) {
  const conexion = await getPool().getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await callback(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
