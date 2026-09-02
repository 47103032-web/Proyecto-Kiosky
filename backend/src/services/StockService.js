/**
 * StockService - Control de inventario, bajas y alertas
 * (CU-03, RF-11, RF-12, RF-13).
 */
import { config } from '../config/env.js';
import { getRepositorios } from '../repositories/index.js';
import { MOTIVOS_BAJA } from '../models/BajaProducto.js';
import { errorValidacion } from '../utils/errors.js';

/** RF-13: productos en o por debajo del stock minimo. */
export async function productosBajoStock() {
  const { productos } = getRepositorios();
  return productos.bajoStock();
}

/** Productos que vencen dentro de la ventana configurada. */
export async function productosProximosAVencer(dias = config.diasProximoVencimiento) {
  const { productos } = getRepositorios();
  return productos.proximosAVencer(dias);
}

/** Productos cuya fecha de vencimiento ya paso. */
export async function productosVencidos() {
  const { productos } = getRepositorios();
  return productos.vencidos();
}

/**
 * CU-03: registra una baja por vencimiento o dano.
 * RF-12: el descuento de inventario lo aplica el repositorio dentro de
 * la misma transaccion que inserta la baja.
 */
export async function registrarBaja({ id_producto, cantidad, motivo, id_usuario }) {
  const errores = {};

  if (!id_producto) {
    errores.id_producto = 'Debe seleccionar un producto.';
  }

  const unidades = Number(cantidad);
  if (!Number.isInteger(unidades) || unidades <= 0) {
    errores.cantidad = 'La cantidad debe ser un numero entero mayor a cero.';
  }

  if (!motivo || !MOTIVOS_BAJA.includes(motivo)) {
    errores.motivo = `El motivo debe ser uno de: ${MOTIVOS_BAJA.join(', ')}.`;
  }

  if (Object.keys(errores).length > 0) {
    throw errorValidacion('No se puede registrar la baja.', errores);
  }

  const { bajas } = getRepositorios();
  return bajas.registrar({ id_producto, cantidad: unidades, motivo, id_usuario });
}

export async function listarBajas(filtros = {}) {
  const { bajas } = getRepositorios();
  return bajas.listar(filtros);
}

/** Historial de movimientos de inventario. */
export async function listarMovimientos(filtros = {}) {
  const { movimientos } = getRepositorios();
  return movimientos.listar(filtros);
}
