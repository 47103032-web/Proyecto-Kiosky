
import mysql from 'mysql2/promise';
import { config } from './env.js';

/**
 * Desfasaje horario local en el formato que espera MySQL, por ejemplo
 * '-03:00' para Argentina.
 */
function desfasajeHorarioLocal(referencia = new Date()) {
  const minutos = -referencia.getTimezoneOffset();
  const signo = minutos < 0 ? '-' : '+';
  const abs = Math.abs(minutos);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${signo}${hh}:${mm}`;
}

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
      timezone: config.db.timezone,
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      // Necesario para que las transacciones de venta sean atomicas
      multipleStatements: false,
    });

    // DEF-003: las ventas se guardan con NOW() del servidor de base de datos
    // y los periodos de los reportes se calculan con la fecha local de este
    // proceso. Si los relojes no coinciden, el reporte del dia deja afuera las
    // ventas recientes. Se alinea la zona horaria de cada conexion con la de
    // la aplicacion para que ambos lados usen el mismo dia. Va en el evento
    // 'connection' y no una sola vez al arrancar, porque el pool abre
    // conexiones nuevas durante toda la ejecucion.
    pool.on('connection', (conexion) => {
      conexion.query('SET time_zone = ?', [desfasajeHorarioLocal()]);
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
