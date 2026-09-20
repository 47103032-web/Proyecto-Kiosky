/**
 * Cliente HTTP de la API Kiosky.
 * Centraliza el token de sesion y la forma de los errores para que las
 * pantallas solo tengan que mostrar `error.message`.
 */
// En desarrollo, Vite redirige /api al backend local. En la demo publicada
// el frontend y la API viven en dominios distintos, y la URL de la API se
// fija al compilar con VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL ?? '/api';

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
