/**
 * Manejo centralizado de errores.
 * Devuelve siempre la misma forma de respuesta para que el frontend
 * pueda mostrar mensajes claros al usuario (Entregable N2, KIO-01:
 * "devolviendo errores claros al frontend").
 */
import { AppError } from '../utils/errors.js';

export function rutaNoEncontrada(req, res) {
  res.status(404).json({
    ok: false,
    codigo: 'RUTA_NO_ENCONTRADA',
    mensaje: `No existe el recurso solicitado: ${req.method} ${req.originalUrl}`,
  });
}

export function manejadorDeErrores(error, _req, res, _siguiente) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      ok: false,
      codigo: error.codigo,
      mensaje: error.message,
      detalles: error.detalles ?? undefined,
    });
  }

  // Error no previsto: se registra completo en el servidor pero al cliente
  // solo se le informa de forma generica.
  console.error('[kiosky] Error no controlado:', error);
  return res.status(500).json({
    ok: false,
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrio un error inesperado. Intente nuevamente.',
  });
}
