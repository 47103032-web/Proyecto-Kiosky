/**
 * Cliente HTTP de la API Kiosky.
 * Centraliza el token de sesion y la forma de los errores para que las
 * pantallas solo tengan que mostrar `error.message`.
 */
const BASE = '/api';

let token = localStorage.getItem('kiosky_token');

export function guardarToken(nuevoToken) {
  token = nuevoToken;
  if (nuevoToken) localStorage.setItem('kiosky_token', nuevoToken);
  else localStorage.removeItem('kiosky_token');
}

export function obtenerToken() {
  return token;
}

/** Error de API que conserva el codigo y los detalles devueltos. */
export class ApiError extends Error {
  constructor(mensaje, codigo, detalles) {
    super(mensaje);
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

// En la pantalla de ingreso, un 401 significa "datos incorrectos", no una
// sesion vencida. Si no se excluyera, el usuario que escribe mal la
// contrasena seria expulsado al login en vez de leer el mensaje de error.
// El patron viene de StockARG (frontend/src/lib/api.ts).
const RUTAS_DE_INGRESO = ['/auth/login'];

/**
 * Si la sesion vencio en medio del uso, cada pantalla mostraria un error sin
 * salida. Se limpia la sesion y se vuelve al ingreso avisando por que.
 * Devuelve true si se encargo de la respuesta.
 */
function atenderSesionVencida(ruta, cuerpo) {
  if (cuerpo?.codigo !== 'SESION_VENCIDA') return false;
  if (RUTAS_DE_INGRESO.some((r) => ruta.startsWith(r))) return false;
  if (typeof window === 'undefined') return false;

  guardarToken(null);
  // replace y no href: la pantalla vencida no queda en el historial.
  window.location.replace('/login?vencida=1');
  return true;
}

async function peticion(ruta, opciones = {}) {
  const cabeceras = { ...(opciones.headers ?? {}) };
  if (opciones.body) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, { ...opciones, headers: cabeceras });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifique que el backend este iniciado.',
      'SIN_CONEXION'
    );
  }

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    if (atenderSesionVencida(ruta, cuerpo)) {
      // La redireccion ya esta en marcha: no tiene sentido que las pantallas
      // muestren un error que el usuario no va a llegar a leer.
      return new Promise(() => {});
    }
    throw new ApiError(
      cuerpo.mensaje ?? 'Ocurrio un error inesperado.',
      cuerpo.codigo ?? 'ERROR',
      cuerpo.detalles
    );
  }
  return cuerpo;
}

export const api = {
  get: (ruta) => peticion(ruta),
  post: (ruta, datos) => peticion(ruta, { method: 'POST', body: JSON.stringify(datos ?? {}) }),
  put: (ruta, datos) => peticion(ruta, { method: 'PUT', body: JSON.stringify(datos ?? {}) }),
  del: (ruta) => peticion(ruta, { method: 'DELETE' }),
};
