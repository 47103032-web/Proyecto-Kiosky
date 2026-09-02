/**
 * VentaService - Reglas de negocio de ventas (CU-01, RF-02, RF-03, RF-14).
 * Entregable N2, punto 13: registrarVenta(), validarStock(), anularVenta().
 */
import { getRepositorios } from '../repositories/index.js';
import { errorNoEncontrado, errorValidacion } from '../utils/errors.js';

/**
 * Valida el stock de todos los items antes de intentar registrar la venta.
 * Devuelve la lista de problemas encontrados (CU-01 FA-1 y FA-2), de modo
 * que el usuario vea de una sola vez todo lo que debe corregir.
 *
 * Nota: el repositorio vuelve a validar el stock dentro de la transaccion.
 * Esta comprobacion previa existe para dar un mensaje claro y completo;
 * la garantia real contra ventas concurrentes (riesgo R-01) esta en la
 * transaccion con SELECT ... FOR UPDATE.
 */
export async function validarStock(items) {
  const { productos } = getRepositorios();
  const problemas = [];

  for (const item of items) {
    const producto = await productos.buscarPorId(item.id_producto);
    if (!producto) {
      problemas.push({
        id_producto: item.id_producto,
        motivo: 'PRODUCTO_INEXISTENTE',
        mensaje: `No existe el producto con id ${item.id_producto}.`,
      });
      continue;
    }
    if (producto.stockActual < Number(item.cantidad)) {
      problemas.push({
        id_producto: producto.id,
        nombre: producto.nombre,
        motivo: 'STOCK_INSUFICIENTE',
        solicitado: Number(item.cantidad),
        disponible: producto.stockActual,
        mensaje:
          `Stock insuficiente para "${producto.nombre}". ` +
          `Solicitado: ${item.cantidad}, disponible: ${producto.stockActual}.`,
      });
    }
  }
  return problemas;
}

/** Valida la forma del pedido antes de tocar la base (CU-01 pasos 5 a 7). */
function validarEntrada(items, idMedioPago) {
  const errores = {};

  if (!Array.isArray(items) || items.length === 0) {
    // Regla de integridad 12: cada venta debe tener al menos un detalle.
    errores.items = 'La venta debe incluir al menos un producto.';
  } else {
    const detalleErrores = [];
    items.forEach((item, indice) => {
      const cantidad = Number(item.cantidad);
      if (!item.id_producto) {
        detalleErrores.push(`Item ${indice + 1}: falta el producto.`);
      }
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        detalleErrores.push(
          `Item ${indice + 1}: la cantidad debe ser un numero entero mayor a cero.`
        );
      }
    });
    if (detalleErrores.length) errores.detalle = detalleErrores;

    // Un mismo producto repetido se rechaza: debe consolidarse en un item.
    const ids = items.map((i) => Number(i.id_producto));
    if (new Set(ids).size !== ids.length) {
      errores.duplicados =
        'Hay productos repetidos. Agrupe las unidades de un mismo producto en un solo item.';
    }
  }

  if (!idMedioPago) {
    errores.id_medio_pago = 'Debe seleccionar un medio de pago.';
  }

  return errores;
}

/** CU-01: registra la venta completa. */
export async function registrarVenta({ items, id_medio_pago, id_usuario }) {
  const errores = validarEntrada(items, id_medio_pago);
  if (Object.keys(errores).length > 0) {
    throw errorValidacion('No se puede registrar la venta.', errores);
  }

  const { mediosPago, ventas } = getRepositorios();

  // RF-08: el medio de pago debe existir y estar habilitado.
  const medio = await mediosPago.buscarPorId(id_medio_pago);
  if (!medio) {
    throw errorNoEncontrado(`No existe el medio de pago con id ${id_medio_pago}.`);
  }
  if (!medio.activo) {
    throw errorValidacion(`El medio de pago "${medio.nombre}" no esta habilitado.`);
  }

  const problemas = await validarStock(items);
  if (problemas.length > 0) {
    throw errorValidacion('No se puede registrar la venta.', { stock: problemas });
  }

  return ventas.registrar({ id_usuario, id_medio_pago, items });
}

/** RF-14: historial de ventas. */
export async function listarVentas(filtros = {}) {
  const { ventas } = getRepositorios();
  return ventas.listar(filtros);
}

export async function obtenerVenta(id) {
  const { ventas } = getRepositorios();
  const venta = await ventas.buscarPorId(id);
  if (!venta) throw errorNoEncontrado(`No existe la venta con id ${id}.`);
  return venta;
}

/** Anula una venta registrada y repone el stock. */
export async function anularVenta(id, idUsuario) {
  const { ventas } = getRepositorios();
  return ventas.anular(id, idUsuario);
}

export async function listarMediosPago() {
  const { mediosPago } = getRepositorios();
  return mediosPago.listar({ soloActivos: true });
}
