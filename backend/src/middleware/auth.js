/**
 * Middleware de autenticacion y autorizacion (RNF-04).
 * Todas las rutas de negocio exigen un token valido, en linea con la
 * precondicion "el usuario debe haber iniciado sesion" de los casos de uso.
 */
import { verificarToken } from '../services/AuthService.js';
import { errorNoAutorizado, errorProhibido } from '../utils/errors.js';

export function requiereAutenticacion(req, _res, siguiente) {
  const cabecera = req.headers.authorization ?? '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return siguiente(errorNoAutorizado('Debe iniciar sesion para realizar esta operacion.'));
  }

  try {
    req.usuario = verificarToken(token);
    return siguiente();
  } catch (error) {
    return siguiente(error);
  }
}

/**
 * Restringe una ruta a determinados roles.
 * CU-02, CU-03, CU-04 y CU-05 tienen al propietario como actor principal.
 */
export function requiereRol(...roles) {
  return (req, _res, siguiente) => {
    if (!req.usuario) {
      return siguiente(errorNoAutorizado('Debe iniciar sesion para realizar esta operacion.'));
    }
    if (!roles.includes(req.usuario.rol)) {
      return siguiente(
        errorProhibido(`Esta operacion requiere el rol: ${roles.join(' o ')}.`)
      );
    }
    return siguiente();
  };
}
