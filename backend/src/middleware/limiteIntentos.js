/**
 * Limite de intentos de inicio de sesion (AUD-10).
 *
 * Cuenta los intentos fallidos por email dentro de una ventana de tiempo que
 * se desplaza. Al superar el maximo, rechaza los intentos siguientes hasta
 * que la ventana se libera.
 *
 * Vive en la memoria del proceso: con una sola instancia de la API, que es el
 * despliegue previsto, alcanza. Si algun dia hubiera mas de una, el limite
 * pasaria a ser por instancia. Queda anotado como limitacion conocida y no
 * como descuido.
 *
 * Node ejecuta en un solo hilo, asi que no hace falta ningun candado: entre
 * la lectura y la escritura del registro no puede intercalarse otra peticion.
 */
import { AppError } from '../utils/errors.js';

const MAXIMO_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

/** email normalizado -> marcas de tiempo de los intentos fallidos vigentes */
const intentos = new Map();

const clave = (email) => String(email ?? '').trim().toLowerCase();

/** Descarta las marcas que quedaron fuera de la ventana. */
function vigentes(k, ahora) {
  const previos = intentos.get(k) ?? [];
  const dentro = previos.filter((momento) => ahora - momento < VENTANA_MS);
  if (dentro.length > 0) intentos.set(k, dentro);
  else intentos.delete(k);
  return dentro;
}

/** Registra un intento fallido. */
export function registrarFallo(email) {
  const k = clave(email);
  if (!k) return;
  const ahora = Date.now();
  intentos.set(k, [...vigentes(k, ahora), ahora]);
}

/** Un inicio de sesion correcto libera la cuenta. */
export function limpiarIntentos(email) {
  intentos.delete(clave(email));
}

/** Vacia el registro. Lo usan las pruebas para aislar cada caso. */
export function reiniciarIntentos() {
  intentos.clear();
}

/**
 * Bloquea el inicio de sesion cuando se superaron los intentos permitidos.
 * Se aplica solo a POST /auth/login.
 */
export function limitarIntentosDeIngreso(req, _res, siguiente) {
  const k = clave(req.body?.email);
  if (!k) return siguiente();

  const ahora = Date.now();
  const fallos = vigentes(k, ahora);

  if (fallos.length >= MAXIMO_INTENTOS) {
    const esperaMs = VENTANA_MS - (ahora - fallos[0]);
    const minutos = Math.max(1, Math.ceil(esperaMs / 60000));
    return siguiente(
      new AppError(
        `Demasiados intentos fallidos. Vuelva a intentar en ${minutos} minuto(s).`,
        429,
        'DEMASIADOS_INTENTOS',
        { minutos_de_espera: minutos }
      )
    );
  }
  return siguiente();
}
