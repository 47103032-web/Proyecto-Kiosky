/**
 * Error de aplicacion con codigo HTTP y codigo de negocio.
 * Permite que los controladores devuelvan mensajes claros al frontend
 * sin exponer detalles internos (RNF-04).
 */
export class AppError extends Error {
  constructor(mensaje, statusCode = 400, codigo = 'ERROR_NEGOCIO', detalles = null) {
    super(mensaje);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const errorValidacion = (mensaje, detalles = null) =>
  new AppError(mensaje, 400, 'VALIDACION', detalles);

export const errorNoEncontrado = (mensaje) =>
  new AppError(mensaje, 404, 'NO_ENCONTRADO');

export const errorNoAutorizado = (mensaje = 'Credenciales invalidas.') =>
  new AppError(mensaje, 401, 'NO_AUTORIZADO');

export const errorProhibido = (mensaje = 'No posee permisos para esta operacion.') =>
  new AppError(mensaje, 403, 'PROHIBIDO');

export const errorConflicto = (mensaje) =>
  new AppError(mensaje, 409, 'CONFLICTO');

/** Stock insuficiente: caso negativo central de CU-01 (FA-1). */
export const errorStockInsuficiente = (producto, solicitado, disponible) =>
  new AppError(
    `Stock insuficiente para "${producto}". Solicitado: ${solicitado}, disponible: ${disponible}.`,
    409,
    'STOCK_INSUFICIENTE',
    { producto, solicitado, disponible }
  );
