/**
 * ProductoService - ABM y busqueda de productos (CU-02, RF-04 a RF-07).
 * Entregable N2, punto 13: crear(), actualizar(), eliminar(), buscar().
 */
import { getRepositorios } from '../repositories/index.js';
import { errorNoEncontrado, errorValidacion } from '../utils/errors.js';

/** RF-07: busqueda por nombre o codigo de barras. */
export async function buscar({ busqueda, idCategoria, incluirInactivos } = {}) {
  const { productos } = getRepositorios();
  return productos.listar({ busqueda, idCategoria, incluirInactivos });
}

export async function obtenerPorId(id) {
  const { productos } = getRepositorios();
  const producto = await productos.buscarPorId(id);
  if (!producto) throw errorNoEncontrado(`No existe el producto con id ${id}.`);
  return producto;
}

/** CU-01 paso 3: localizar un producto por su codigo de barras. */
export async function obtenerPorCodigoBarra(codigo) {
  const { productos } = getRepositorios();
  const producto = await productos.buscarPorCodigoBarra(codigo);
  if (!producto) {
    // CU-01 FA-2: producto inexistente.
    throw errorNoEncontrado(`No hay ningun producto registrado con el codigo "${codigo}".`);
  }
  return producto;
}

/**
 * Valida los datos de un producto (CU-02 paso 6).
 * Reune todos los problemas para que el frontend los muestre juntos.
 */
export function validarDatosProducto(datos, { esAlta = true } = {}) {
  const errores = {};

  const requerido = (campo) =>
    esAlta || datos[campo] !== undefined;

  if (requerido('nombre')) {
    if (!datos.nombre || String(datos.nombre).trim().length < 2) {
      errores.nombre = 'El nombre es obligatorio y debe tener al menos 2 caracteres.';
    }
  }

  if (requerido('precio')) {
    const precio = Number(datos.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      errores.precio = 'El precio debe ser un numero mayor o igual a cero.';
    }
  }

  if (datos.stock_actual !== undefined) {
    const stock = Number(datos.stock_actual);
    if (!Number.isInteger(stock) || stock < 0) {
      errores.stock_actual = 'El stock debe ser un numero entero mayor o igual a cero.';
    }
  }

  if (datos.stock_minimo !== undefined) {
    const minimo = Number(datos.stock_minimo);
    if (!Number.isInteger(minimo) || minimo < 0) {
      errores.stock_minimo = 'El stock minimo debe ser un numero entero mayor o igual a cero.';
    }
  }

  if (datos.fecha_vencimiento) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_vencimiento)) {
      errores.fecha_vencimiento = 'La fecha de vencimiento debe tener formato AAAA-MM-DD.';
    }
  }

  return errores;
}

/** RF-04: alta de producto. */
export async function crear(datos, idUsuario) {
  const errores = validarDatosProducto(datos, { esAlta: true });
  if (Object.keys(errores).length > 0) {
    throw errorValidacion('Los datos del producto no son validos.', errores);
  }

  const { productos } = getRepositorios();
  return productos.crear({
    ...datos,
    codigo_barra: datos.codigo_barra?.trim() || null,
    nombre: datos.nombre.trim(),
    id_usuario: idUsuario,
  });
}

/** RF-05: modificacion de producto. */
export async function actualizar(id, datos, idUsuario) {
  const errores = validarDatosProducto(datos, { esAlta: false });
  if (Object.keys(errores).length > 0) {
    throw errorValidacion('Los datos del producto no son validos.', errores);
  }

  await obtenerPorId(id);
  const { productos } = getRepositorios();
  return productos.actualizar(id, { ...datos, id_usuario: idUsuario });
}

/** RF-06: baja de producto. */
export async function eliminar(id) {
  await obtenerPorId(id);
  const { productos } = getRepositorios();
  return productos.eliminar(id);
}

export async function listarCategorias() {
  const { categorias } = getRepositorios();
  return categorias.listar();
}
