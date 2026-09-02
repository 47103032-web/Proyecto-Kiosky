/**
 * Repositorios en memoria.
 *
 * Implementan la misma interfaz que los repositorios MySQL para que la
 * capa de servicios sea identica en ambos modos (Entregable N2, punto 14:
 * "Repositorios / DAO centralizan consultas y persistencia").
 *
 * Se usan cuando no hay un servidor MySQL disponible, de modo que el
 * sistema y el plan de pruebas funcionales puedan ejecutarse igual.
 */
import { crearDatasetInicial, formatearFechaHora } from '../db/memoryData.js';
import { Usuario } from '../models/Usuario.js';
import { Categoria } from '../models/Categoria.js';
import { MedioPago } from '../models/MedioPago.js';
import { Producto } from '../models/Producto.js';
import { Venta } from '../models/Venta.js';
import { MovimientoStock } from '../models/MovimientoStock.js';
import { BajaProducto } from '../models/BajaProducto.js';
import {
  errorConflicto,
  errorNoEncontrado,
  errorStockInsuficiente,
} from '../utils/errors.js';

let datos = crearDatasetInicial();

/** Reinicia el estado. Usado por las pruebas para aislar cada caso. */
export function reiniciarDatosEnMemoria() {
  datos = crearDatasetInicial();
}

export function obtenerDatosEnMemoria() {
  return datos;
}

const siguienteId = (coleccion, campo) =>
  coleccion.reduce((max, fila) => Math.max(max, fila[campo] ?? 0), 0) + 1;

const ahora = () => formatearFechaHora(new Date());

/** Normaliza texto para busquedas insensibles a mayusculas y acentos. */
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Convierte 'YYYY-MM-DD' en limites comparables como texto. */
const desdeLimite = (fecha) => (fecha ? `${fecha} 00:00:00` : null);
const hastaLimite = (fecha) => (fecha ? `${fecha} 23:59:59` : null);

function enRango(fechaHora, desde, hasta) {
  const d = desdeLimite(desde);
  const h = hastaLimite(hasta);
  if (d && fechaHora < d) return false;
  if (h && fechaHora > h) return false;
  return true;
}

const nombreCategoria = (idCategoria) =>
  datos.categorias.find((c) => c.id_categoria === idCategoria)?.nombre ?? null;

const aProducto = (fila) =>
  new Producto({ ...fila, categoria: nombreCategoria(fila.id_categoria) });

// ---------------------------------------------------------------------
// Usuarios (RF-01)
// ---------------------------------------------------------------------
const usuarios = {
  async buscarPorEmail(email) {
    const fila = datos.usuarios.find(
      (u) => normalizar(u.email) === normalizar(email)
    );
    return fila ? new Usuario(fila) : null;
  },

  async buscarPorId(id) {
    const fila = datos.usuarios.find((u) => u.id_usuario === Number(id));
    return fila ? new Usuario(fila) : null;
  },
};

// ---------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------
const categorias = {
  async listar() {
    return datos.categorias.map((c) => new Categoria(c));
  },
};

// ---------------------------------------------------------------------
// Medios de pago (RF-08)
// ---------------------------------------------------------------------
const mediosPago = {
  async listar({ soloActivos = true } = {}) {
    return datos.medios_pago
      .filter((m) => (soloActivos ? m.activo : true))
      .map((m) => new MedioPago(m));
  },

  async buscarPorId(id) {
    const fila = datos.medios_pago.find((m) => m.id_medio_pago === Number(id));
    return fila ? new MedioPago(fila) : null;
  },
};

// ---------------------------------------------------------------------
// Productos (RF-04 a RF-07, RF-13)
// ---------------------------------------------------------------------
const productos = {
  /** RF-07: busqueda por nombre o codigo de barras. */
  async listar({ busqueda = '', idCategoria = null, incluirInactivos = false } = {}) {
    const termino = normalizar(busqueda);
    return datos.productos
      .filter((p) => (incluirInactivos ? true : p.activo))
      .filter((p) =>
        idCategoria ? p.id_categoria === Number(idCategoria) : true
      )
      .filter((p) => {
        if (!termino) return true;
        return (
          normalizar(p.nombre).includes(termino) ||
          normalizar(p.codigo_barra).includes(termino)
        );
      })
      .map(aProducto)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  },

  async buscarPorId(id) {
    const fila = datos.productos.find((p) => p.id_producto === Number(id));
    return fila ? aProducto(fila) : null;
  },

  async buscarPorCodigoBarra(codigo) {
    if (!codigo) return null;
    const fila = datos.productos.find(
      (p) => p.codigo_barra && normalizar(p.codigo_barra) === normalizar(codigo)
    );
    return fila ? aProducto(fila) : null;
  },

  /** RF-04. El codigo de barras debe ser unico cuando se informa. */
  async crear(entrada) {
    if (entrada.codigo_barra) {
      const duplicado = await productos.buscarPorCodigoBarra(entrada.codigo_barra);
      if (duplicado) {
        throw errorConflicto(
          `Ya existe un producto con el codigo de barras "${entrada.codigo_barra}".`
        );
      }
    }

    const fila = {
      id_producto: siguienteId(datos.productos, 'id_producto'),
      codigo_barra: entrada.codigo_barra ?? null,
      nombre: entrada.nombre,
      descripcion: entrada.descripcion ?? null,
      precio: Number(entrada.precio),
      stock_actual: Number(entrada.stock_actual ?? 0),
      stock_minimo: Number(entrada.stock_minimo ?? 0),
      fecha_vencimiento: entrada.fecha_vencimiento ?? null,
      id_categoria: entrada.id_categoria ?? null,
      activo: true,
    };
    datos.productos.push(fila);

    if (fila.stock_actual > 0) {
      registrarMovimiento({
        id_producto: fila.id_producto,
        tipo: 'entrada',
        cantidad: fila.stock_actual,
        motivo: 'Alta de producto',
        id_usuario: entrada.id_usuario ?? 1,
      });
    }
    return aProducto(fila);
  },

  /** RF-05: modificacion de un producto existente. */
  async actualizar(id, cambios) {
    const fila = datos.productos.find((p) => p.id_producto === Number(id));
    if (!fila) throw errorNoEncontrado(`No existe el producto con id ${id}.`);

    if (cambios.codigo_barra) {
      const duplicado = datos.productos.find(
        (p) =>
          p.id_producto !== fila.id_producto &&
          p.codigo_barra &&
          normalizar(p.codigo_barra) === normalizar(cambios.codigo_barra)
      );
      if (duplicado) {
        throw errorConflicto(
          `Ya existe otro producto con el codigo de barras "${cambios.codigo_barra}".`
        );
      }
    }

    const camposEditables = [
      'codigo_barra',
      'nombre',
      'descripcion',
      'precio',
      'stock_actual',
      'stock_minimo',
      'fecha_vencimiento',
      'id_categoria',
    ];
    const stockPrevio = fila.stock_actual;

    for (const campo of camposEditables) {
      if (cambios[campo] !== undefined) fila[campo] = cambios[campo];
    }
    fila.precio = Number(fila.precio);
    fila.stock_actual = Number(fila.stock_actual);
    fila.stock_minimo = Number(fila.stock_minimo);

    // Un ajuste manual de stock queda registrado para trazabilidad.
    if (fila.stock_actual !== stockPrevio) {
      registrarMovimiento({
        id_producto: fila.id_producto,
        tipo: 'ajuste',
        cantidad: Math.abs(fila.stock_actual - stockPrevio),
        motivo: `Ajuste manual: ${stockPrevio} -> ${fila.stock_actual}`,
        id_usuario: cambios.id_usuario ?? 1,
      });
    }
    return aProducto(fila);
  },

  /**
   * RF-06: baja de producto.
   * Si el producto participa en ventas se desactiva en lugar de borrarse,
   * para no romper la trazabilidad del historial (regla de integridad 12).
   */
  async eliminar(id) {
    const indice = datos.productos.findIndex((p) => p.id_producto === Number(id));
    if (indice === -1) throw errorNoEncontrado(`No existe el producto con id ${id}.`);

    const tieneVentas = datos.detalle_venta.some(
      (d) => d.id_producto === Number(id)
    );
    if (tieneVentas) {
      datos.productos[indice].activo = false;
      return { eliminado: false, desactivado: true };
    }
    datos.productos.splice(indice, 1);
    return { eliminado: true, desactivado: false };
  },

  /** RF-13: productos en o por debajo del stock minimo. */
  async bajoStock() {
    return datos.productos
      .filter((p) => p.activo && p.stock_actual <= p.stock_minimo)
      .map(aProducto)
      .sort((a, b) => a.stockActual - b.stockActual);
  },

  /** Alerta del dashboard: vencen dentro de los proximos `dias`. */
  async proximosAVencer(dias = 30) {
    return datos.productos
      .filter((p) => p.activo)
      .map(aProducto)
      .filter((p) => p.estaProximoAVencer(dias))
      .sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento)));
  },

  /** Productos cuya fecha de vencimiento ya paso. */
  async vencidos() {
    return datos.productos
      .filter((p) => p.activo)
      .map(aProducto)
      .filter((p) => p.estaVencido())
      .sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento)));
  },
};

// ---------------------------------------------------------------------
// Movimientos de stock (trazabilidad de inventario)
// ---------------------------------------------------------------------
function registrarMovimiento({ id_producto, tipo, cantidad, motivo, id_usuario }) {
  const fila = {
    id_movimiento: siguienteId(datos.movimientos_stock, 'id_movimiento'),
    id_producto: Number(id_producto),
    tipo,
    cantidad: Number(cantidad),
    motivo: motivo ?? null,
    fecha_hora: ahora(),
    id_usuario: Number(id_usuario),
  };
  datos.movimientos_stock.push(fila);
  return fila;
}

const movimientos = {
  async listar({ idProducto = null, limite = 100 } = {}) {
    return datos.movimientos_stock
      .filter((m) => (idProducto ? m.id_producto === Number(idProducto) : true))
      .slice()
      .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
      .slice(0, limite)
      .map(
        (m) =>
          new MovimientoStock({
            ...m,
            nombre_producto:
              datos.productos.find((p) => p.id_producto === m.id_producto)?.nombre ?? null,
          })
      );
  },
};

// ---------------------------------------------------------------------
// Ventas (CU-01, RF-02, RF-03, RF-14)
// ---------------------------------------------------------------------

/** Reconstruye una Venta completa a partir de su cabecera. */
function armarVenta(cabecera) {
  const detalles = datos.detalle_venta
    .filter((d) => d.id_venta === cabecera.id_venta)
    .map((d) => ({
      ...d,
      nombre:
        datos.productos.find((p) => p.id_producto === d.id_producto)?.nombre ?? null,
    }));

  return new Venta({
    ...cabecera,
    detalles,
    usuario: datos.usuarios.find((u) => u.id_usuario === cabecera.id_usuario)?.nombre ?? null,
    medio_pago:
      datos.medios_pago.find((m) => m.id_medio_pago === cabecera.id_medio_pago)?.nombre ?? null,
  });
}

const ventas = {
  /**
   * CU-01 flujo principal, pasos 8 a 10.
   *
   * Operacion atomica: revalida el stock, inserta cabecera y detalles,
   * descuenta inventario y registra un movimiento por producto.
   * Si algun item no tiene stock suficiente, no se persiste nada
   * (CU-01 FA-1 / regla de integridad 12).
   */
  async registrar({ id_usuario, id_medio_pago, items }) {
    // 1) Revalidacion de stock sobre el estado actual, antes de escribir.
    const preparados = items.map((item) => {
      const fila = datos.productos.find(
        (p) => p.id_producto === Number(item.id_producto)
      );
      if (!fila) {
        throw errorNoEncontrado(`No existe el producto con id ${item.id_producto}.`);
      }
      const cantidad = Number(item.cantidad);
      if (fila.stock_actual < cantidad) {
        throw errorStockInsuficiente(fila.nombre, cantidad, fila.stock_actual);
      }
      return { fila, cantidad, precio_unitario: Number(fila.precio) };
    });

    // 2) Cabecera.
    const cabecera = {
      id_venta: siguienteId(datos.ventas, 'id_venta'),
      fecha_hora: ahora(),
      total: 0,
      id_usuario: Number(id_usuario),
      id_medio_pago: Number(id_medio_pago),
      estado: 'registrada',
    };

    // 3) Detalles, descuento de stock y trazabilidad.
    let total = 0;
    for (const { fila, cantidad, precio_unitario } of preparados) {
      const subtotal = Math.round(cantidad * precio_unitario * 100) / 100;
      total += subtotal;

      datos.detalle_venta.push({
        id_detalle: siguienteId(datos.detalle_venta, 'id_detalle'),
        id_venta: cabecera.id_venta,
        id_producto: fila.id_producto,
        cantidad,
        precio_unitario,
        subtotal,
      });

      fila.stock_actual -= cantidad;

      registrarMovimiento({
        id_producto: fila.id_producto,
        tipo: 'venta',
        cantidad,
        motivo: `Venta #${cabecera.id_venta}`,
        id_usuario: cabecera.id_usuario,
      });
    }

    cabecera.total = Math.round(total * 100) / 100;
    datos.ventas.push(cabecera);
    return armarVenta(cabecera);
  },

  /** RF-14: historial de ventas. */
  async listar({ desde = null, hasta = null, estado = null, limite = 200 } = {}) {
    return datos.ventas
      .filter((v) => enRango(v.fecha_hora, desde, hasta))
      .filter((v) => (estado ? v.estado === estado : true))
      .slice()
      .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
      .slice(0, limite)
      .map(armarVenta);
  },

  async buscarPorId(id) {
    const cabecera = datos.ventas.find((v) => v.id_venta === Number(id));
    return cabecera ? armarVenta(cabecera) : null;
  },

  /** Anula una venta y devuelve las unidades al inventario. */
  async anular(id, idUsuario) {
    const cabecera = datos.ventas.find((v) => v.id_venta === Number(id));
    if (!cabecera) throw errorNoEncontrado(`No existe la venta con id ${id}.`);
    if (cabecera.estado === 'anulada') {
      throw errorConflicto(`La venta #${id} ya se encuentra anulada.`);
    }

    for (const d of datos.detalle_venta.filter((x) => x.id_venta === cabecera.id_venta)) {
      const fila = datos.productos.find((p) => p.id_producto === d.id_producto);
      if (fila) {
        fila.stock_actual += d.cantidad;
        registrarMovimiento({
          id_producto: fila.id_producto,
          tipo: 'entrada',
          cantidad: d.cantidad,
          motivo: `Anulacion de venta #${cabecera.id_venta}`,
          id_usuario: idUsuario,
        });
      }
    }
    cabecera.estado = 'anulada';
    return armarVenta(cabecera);
  },

  /**
   * CU-04 / RF-09: resumen de ventas de un periodo.
   * Solo considera ventas en estado "registrada": las anuladas no
   * suman al total ni al ranking.
   */
  async resumenPorPeriodo({ desde = null, hasta = null } = {}) {
    const delPeriodo = datos.ventas.filter(
      (v) => v.estado === 'registrada' && enRango(v.fecha_hora, desde, hasta)
    );
    const ids = new Set(delPeriodo.map((v) => v.id_venta));
    const detalles = datos.detalle_venta.filter((d) => ids.has(d.id_venta));

    const porMedioPago = new Map();
    for (const v of delPeriodo) {
      const nombre =
        datos.medios_pago.find((m) => m.id_medio_pago === v.id_medio_pago)?.nombre ??
        'Sin especificar';
      const acumulado = porMedioPago.get(nombre) ?? { medio_pago: nombre, cantidad: 0, total: 0 };
      acumulado.cantidad += 1;
      acumulado.total += v.total;
      porMedioPago.set(nombre, acumulado);
    }

    const porProducto = new Map();
    for (const d of detalles) {
      const nombre =
        datos.productos.find((p) => p.id_producto === d.id_producto)?.nombre ?? 'Producto eliminado';
      const acumulado =
        porProducto.get(d.id_producto) ??
        { id_producto: d.id_producto, nombre, cantidad: 0, total: 0 };
      acumulado.cantidad += d.cantidad;
      acumulado.total += d.subtotal;
      porProducto.set(d.id_producto, acumulado);
    }

    const total = delPeriodo.reduce((acc, v) => acc + v.total, 0);

    return {
      desde,
      hasta,
      total_vendido: Math.round(total * 100) / 100,
      cantidad_ventas: delPeriodo.length,
      ticket_promedio:
        delPeriodo.length > 0 ? Math.round((total / delPeriodo.length) * 100) / 100 : 0,
      medios_pago: [...porMedioPago.values()].sort((a, b) => b.total - a.total),
      productos: [...porProducto.values()].sort((a, b) => b.cantidad - a.cantidad),
    };
  },

  /** CU-05 / RF-10: ranking de productos mas vendidos. */
  async masVendidos({ desde = null, hasta = null, limite = 10 } = {}) {
    const resumen = await ventas.resumenPorPeriodo({ desde, hasta });
    return resumen.productos.slice(0, limite).map((p, indice) => ({
      posicion: indice + 1,
      ...p,
      total: Math.round(p.total * 100) / 100,
    }));
  },
};

// ---------------------------------------------------------------------
// Bajas de producto (CU-03, RF-11, RF-12)
// ---------------------------------------------------------------------
const bajas = {
  /**
   * Registra la baja y descuenta el stock en una sola operacion.
   * CU-03 FA-1: si la cantidad supera el stock disponible no se
   * persiste nada y se informa el error.
   */
  async registrar({ id_producto, cantidad, motivo, id_usuario }) {
    const fila = datos.productos.find((p) => p.id_producto === Number(id_producto));
    if (!fila) throw errorNoEncontrado(`No existe el producto con id ${id_producto}.`);

    const unidades = Number(cantidad);
    const baja = new BajaProducto({
      id_producto: fila.id_producto,
      cantidad: unidades,
      motivo,
      id_usuario,
      nombre_producto: fila.nombre,
    });

    const problema = baja.validarCantidad(fila.stock_actual);
    if (problema) throw errorStockInsuficiente(fila.nombre, unidades, fila.stock_actual);

    fila.stock_actual -= unidades;

    const registro = {
      id_baja: siguienteId(datos.bajas_producto, 'id_baja'),
      id_producto: fila.id_producto,
      cantidad: unidades,
      motivo,
      fecha_hora: ahora(),
      id_usuario: Number(id_usuario),
    };
    datos.bajas_producto.push(registro);

    registrarMovimiento({
      id_producto: fila.id_producto,
      tipo: 'baja',
      cantidad: unidades,
      motivo: `Baja por producto ${motivo}`,
      id_usuario,
    });

    return new BajaProducto({ ...registro, nombre_producto: fila.nombre });
  },

  async listar({ desde = null, hasta = null, limite = 100 } = {}) {
    return datos.bajas_producto
      .filter((b) => enRango(b.fecha_hora, desde, hasta))
      .slice()
      .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
      .slice(0, limite)
      .map(
        (b) =>
          new BajaProducto({
            ...b,
            nombre_producto:
              datos.productos.find((p) => p.id_producto === b.id_producto)?.nombre ?? null,
          })
      );
  },
};

/** Construye el conjunto de repositorios en memoria. */
export function crearRepositoriosEnMemoria() {
  return { usuarios, categorias, mediosPago, productos, ventas, movimientos, bajas };
}
