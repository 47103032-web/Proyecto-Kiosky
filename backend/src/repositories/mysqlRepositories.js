/**
 * Repositorios MySQL.
 *
 * Centralizan todas las consultas SQL del sistema (Entregable N2,
 * punto 14). Exponen exactamente la misma interfaz que los repositorios
 * en memoria, de modo que la capa de servicios no cambia segun el motor.
 */
import { getPool, conTransaccion } from '../config/db.js';
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

/** Limites de fecha para los filtros por periodo. */
const desdeLimite = (fecha) => (fecha ? `${fecha} 00:00:00` : null);
const hastaLimite = (fecha) => (fecha ? `${fecha} 23:59:59` : null);

/**
 * Construye la clausula de rango de fechas y sus parametros.
 * Evita concatenar valores en el SQL (proteccion contra inyeccion).
 */
function clausulaRango(campo, desde, hasta) {
  const condiciones = [];
  const parametros = [];
  if (desde) {
    condiciones.push(`${campo} >= ?`);
    parametros.push(desdeLimite(desde));
  }
  if (hasta) {
    condiciones.push(`${campo} <= ?`);
    parametros.push(hastaLimite(hasta));
  }
  return { condiciones, parametros };
}

const usuarios = {
  async buscarPorEmail(email) {
    const [filas] = await getPool().query(
      'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    return filas.length ? new Usuario(filas[0]) : null;
  },

  async buscarPorId(id) {
    const [filas] = await getPool().query(
      'SELECT * FROM usuarios WHERE id_usuario = ? LIMIT 1',
      [id]
    );
    return filas.length ? new Usuario(filas[0]) : null;
  },
};

const categorias = {
  async listar() {
    const [filas] = await getPool().query(
      'SELECT * FROM categorias ORDER BY nombre'
    );
    return filas.map((f) => new Categoria(f));
  },
};

const mediosPago = {
  async listar({ soloActivos = true } = {}) {
    const sql = soloActivos
      ? 'SELECT * FROM medios_pago WHERE activo = TRUE ORDER BY id_medio_pago'
      : 'SELECT * FROM medios_pago ORDER BY id_medio_pago';
    const [filas] = await getPool().query(sql);
    return filas.map((f) => new MedioPago(f));
  },

  async buscarPorId(id) {
    const [filas] = await getPool().query(
      'SELECT * FROM medios_pago WHERE id_medio_pago = ? LIMIT 1',
      [id]
    );
    return filas.length ? new MedioPago(filas[0]) : null;
  },
};

/** SELECT base de productos, con el nombre de la categoria resuelto. */
const SELECT_PRODUCTO = `
  SELECT p.*, c.nombre AS categoria
  FROM productos p
  LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
`;

const productos = {
  /** RF-07: busqueda por nombre o codigo de barras. */
  async listar({ busqueda = '', idCategoria = null, incluirInactivos = false } = {}) {
    const condiciones = [];
    const parametros = [];

    if (!incluirInactivos) condiciones.push('p.activo = TRUE');
    if (idCategoria) {
      condiciones.push('p.id_categoria = ?');
      parametros.push(idCategoria);
    }
    if (busqueda) {
      condiciones.push('(p.nombre LIKE ? OR p.codigo_barra LIKE ?)');
      parametros.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [filas] = await getPool().query(
      `${SELECT_PRODUCTO} ${where} ORDER BY p.nombre`,
      parametros
    );
    return filas.map((f) => new Producto(f));
  },

  async buscarPorId(id) {
    const [filas] = await getPool().query(
      `${SELECT_PRODUCTO} WHERE p.id_producto = ? LIMIT 1`,
      [id]
    );
    return filas.length ? new Producto(filas[0]) : null;
  },

  async buscarPorCodigoBarra(codigo) {
    if (!codigo) return null;
    const [filas] = await getPool().query(
      `${SELECT_PRODUCTO} WHERE p.codigo_barra = ? LIMIT 1`,
      [codigo]
    );
    return filas.length ? new Producto(filas[0]) : null;
  },

  /** RF-04: alta de producto. */
  async crear(entrada) {
    return conTransaccion(async (cx) => {
      if (entrada.codigo_barra) {
        const [dup] = await cx.query(
          'SELECT id_producto FROM productos WHERE codigo_barra = ? LIMIT 1',
          [entrada.codigo_barra]
        );
        if (dup.length) {
          throw errorConflicto(
            `Ya existe un producto con el codigo de barras "${entrada.codigo_barra}".`
          );
        }
      }

      const [resultado] = await cx.query(
        `INSERT INTO productos
           (codigo_barra, nombre, descripcion, precio, stock_actual,
            stock_minimo, fecha_vencimiento, id_categoria, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          entrada.codigo_barra ?? null,
          entrada.nombre,
          entrada.descripcion ?? null,
          entrada.precio,
          entrada.stock_actual ?? 0,
          entrada.stock_minimo ?? 0,
          entrada.fecha_vencimiento ?? null,
          entrada.id_categoria ?? null,
        ]
      );

      const stockInicial = Number(entrada.stock_actual ?? 0);
      if (stockInicial > 0) {
        await cx.query(
          `INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, id_usuario)
           VALUES (?, 'entrada', ?, 'Alta de producto', ?)`,
          [resultado.insertId, stockInicial, entrada.id_usuario ?? 1]
        );
      }

      const [filas] = await cx.query(
        `${SELECT_PRODUCTO} WHERE p.id_producto = ?`,
        [resultado.insertId]
      );
      return new Producto(filas[0]);
    });
  },

  /** RF-05: modificacion de producto. */
  async actualizar(id, cambios) {
    return conTransaccion(async (cx) => {
      const [actuales] = await cx.query(
        'SELECT * FROM productos WHERE id_producto = ? FOR UPDATE',
        [id]
      );
      if (!actuales.length) throw errorNoEncontrado(`No existe el producto con id ${id}.`);
      const actual = actuales[0];

      if (cambios.codigo_barra) {
        const [dup] = await cx.query(
          'SELECT id_producto FROM productos WHERE codigo_barra = ? AND id_producto <> ? LIMIT 1',
          [cambios.codigo_barra, id]
        );
        if (dup.length) {
          throw errorConflicto(
            `Ya existe otro producto con el codigo de barras "${cambios.codigo_barra}".`
          );
        }
      }

      const campos = [
        'codigo_barra',
        'nombre',
        'descripcion',
        'precio',
        'stock_actual',
        'stock_minimo',
        'fecha_vencimiento',
        'id_categoria',
      ];
      const asignaciones = [];
      const parametros = [];
      for (const campo of campos) {
        if (cambios[campo] !== undefined) {
          asignaciones.push(`${campo} = ?`);
          parametros.push(cambios[campo]);
        }
      }

      if (asignaciones.length) {
        parametros.push(id);
        await cx.query(
          `UPDATE productos SET ${asignaciones.join(', ')} WHERE id_producto = ?`,
          parametros
        );
      }

      // Un ajuste manual de stock queda registrado para trazabilidad.
      if (cambios.stock_actual !== undefined && Number(cambios.stock_actual) !== actual.stock_actual) {
        await cx.query(
          `INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, id_usuario)
           VALUES (?, 'ajuste', ?, ?, ?)`,
          [
            id,
            Math.abs(Number(cambios.stock_actual) - actual.stock_actual),
            `Ajuste manual: ${actual.stock_actual} -> ${cambios.stock_actual}`,
            cambios.id_usuario ?? 1,
          ]
        );
      }

      const [filas] = await cx.query(`${SELECT_PRODUCTO} WHERE p.id_producto = ?`, [id]);
      return new Producto(filas[0]);
    });
  },

  /**
   * RF-06: baja de producto.
   * Si participa en ventas se desactiva para preservar el historial.
   */
  async eliminar(id) {
    return conTransaccion(async (cx) => {
      const [existe] = await cx.query(
        'SELECT id_producto FROM productos WHERE id_producto = ?',
        [id]
      );
      if (!existe.length) throw errorNoEncontrado(`No existe el producto con id ${id}.`);

      const [ventasDelProducto] = await cx.query(
        'SELECT COUNT(*) AS total FROM detalle_venta WHERE id_producto = ?',
        [id]
      );

      if (Number(ventasDelProducto[0].total) > 0) {
        await cx.query('UPDATE productos SET activo = FALSE WHERE id_producto = ?', [id]);
        return { eliminado: false, desactivado: true };
      }

      await cx.query('DELETE FROM movimientos_stock WHERE id_producto = ?', [id]);
      await cx.query('DELETE FROM bajas_producto WHERE id_producto = ?', [id]);
      await cx.query('DELETE FROM productos WHERE id_producto = ?', [id]);
      return { eliminado: true, desactivado: false };
    });
  },

  /** RF-13: alerta de bajo stock. */
  async bajoStock() {
    const [filas] = await getPool().query(
      `${SELECT_PRODUCTO}
       WHERE p.activo = TRUE AND p.stock_actual <= p.stock_minimo
       ORDER BY p.stock_actual ASC`
    );
    return filas.map((f) => new Producto(f));
  },

  /** Alerta del dashboard: vencen dentro de los proximos `dias`. */
  async proximosAVencer(dias = 30) {
    const [filas] = await getPool().query(
      `${SELECT_PRODUCTO}
       WHERE p.activo = TRUE
         AND p.fecha_vencimiento IS NOT NULL
         AND p.fecha_vencimiento >= CURDATE()
         AND p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY p.fecha_vencimiento ASC`,
      [dias]
    );
    return filas.map((f) => new Producto(f));
  },

  /** Productos cuya fecha de vencimiento ya paso. */
  async vencidos() {
    const [filas] = await getPool().query(
      `${SELECT_PRODUCTO}
       WHERE p.activo = TRUE
         AND p.fecha_vencimiento IS NOT NULL
         AND p.fecha_vencimiento < CURDATE()
       ORDER BY p.fecha_vencimiento ASC`
    );
    return filas.map((f) => new Producto(f));
  },
};

const movimientos = {
  async listar({ idProducto = null, limite = 100 } = {}) {
    const where = idProducto ? 'WHERE m.id_producto = ?' : '';
    const parametros = idProducto ? [idProducto, limite] : [limite];
    const [filas] = await getPool().query(
      `SELECT m.*, p.nombre AS nombre_producto
       FROM movimientos_stock m
       JOIN productos p ON p.id_producto = m.id_producto
       ${where}
       ORDER BY m.fecha_hora DESC, m.id_movimiento DESC
       LIMIT ?`,
      parametros
    );
    return filas.map((f) => new MovimientoStock(f));
  },
};

/** Carga una venta completa con sus detalles. */
async function armarVenta(ejecutor, idVenta) {
  const [cabeceras] = await ejecutor.query(
    `SELECT v.*, u.nombre AS usuario, mp.nombre AS medio_pago
     FROM ventas v
     JOIN usuarios u     ON u.id_usuario = v.id_usuario
     JOIN medios_pago mp ON mp.id_medio_pago = v.id_medio_pago
     WHERE v.id_venta = ?`,
    [idVenta]
  );
  if (!cabeceras.length) return null;

  const [detalles] = await ejecutor.query(
    `SELECT d.*, p.nombre
     FROM detalle_venta d
     JOIN productos p ON p.id_producto = d.id_producto
     WHERE d.id_venta = ?
     ORDER BY d.id_detalle`,
    [idVenta]
  );

  return new Venta({ ...cabeceras[0], detalles });
}

const ventas = {
  /**
   * CU-01 pasos 8 a 10, en una sola transaccion.
   *
   * El SELECT ... FOR UPDATE bloquea las filas de producto hasta el
   * commit: mitiga el riesgo R-01 (errores de stock por ventas
   * concurrentes) revalidando el stock real antes de descontarlo.
   */
  async registrar({ id_usuario, id_medio_pago, items }) {
    return conTransaccion(async (cx) => {
      const [resultadoVenta] = await cx.query(
        `INSERT INTO ventas (fecha_hora, total, id_usuario, id_medio_pago, estado)
         VALUES (NOW(), 0, ?, ?, 'registrada')`,
        [id_usuario, id_medio_pago]
      );
      const idVenta = resultadoVenta.insertId;

      let total = 0;
      for (const item of items) {
        const [filas] = await cx.query(
          'SELECT id_producto, nombre, precio, stock_actual FROM productos WHERE id_producto = ? FOR UPDATE',
          [item.id_producto]
        );
        if (!filas.length) {
          throw errorNoEncontrado(`No existe el producto con id ${item.id_producto}.`);
        }

        const producto = filas[0];
        const cantidad = Number(item.cantidad);
        if (producto.stock_actual < cantidad) {
          throw errorStockInsuficiente(producto.nombre, cantidad, producto.stock_actual);
        }

        const precioUnitario = Number(producto.precio);
        const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
        total += subtotal;

        await cx.query(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idVenta, producto.id_producto, cantidad, precioUnitario, subtotal]
        );

        // RF-03: descuento automatico de stock.
        await cx.query(
          'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?',
          [cantidad, producto.id_producto]
        );

        await cx.query(
          `INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, id_usuario)
           VALUES (?, 'venta', ?, ?, ?)`,
          [producto.id_producto, cantidad, `Venta #${idVenta}`, id_usuario]
        );
      }

      await cx.query('UPDATE ventas SET total = ? WHERE id_venta = ?', [
        Math.round(total * 100) / 100,
        idVenta,
      ]);

      return armarVenta(cx, idVenta);
    });
  },

  /** RF-14: historial de ventas. */
  async listar({ desde = null, hasta = null, estado = null, limite = 200 } = {}) {
    const { condiciones, parametros } = clausulaRango('v.fecha_hora', desde, hasta);
    if (estado) {
      condiciones.push('v.estado = ?');
      parametros.push(estado);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    parametros.push(limite);

    const [cabeceras] = await getPool().query(
      `SELECT v.*, u.nombre AS usuario, mp.nombre AS medio_pago
       FROM ventas v
       JOIN usuarios u     ON u.id_usuario = v.id_usuario
       JOIN medios_pago mp ON mp.id_medio_pago = v.id_medio_pago
       ${where}
       ORDER BY v.fecha_hora DESC
       LIMIT ?`,
      parametros
    );
    if (!cabeceras.length) return [];

    const ids = cabeceras.map((v) => v.id_venta);
    const [detalles] = await getPool().query(
      `SELECT d.*, p.nombre
       FROM detalle_venta d
       JOIN productos p ON p.id_producto = d.id_producto
       WHERE d.id_venta IN (?)
       ORDER BY d.id_detalle`,
      [ids]
    );

    return cabeceras.map(
      (c) =>
        new Venta({
          ...c,
          detalles: detalles.filter((d) => d.id_venta === c.id_venta),
        })
    );
  },

  async buscarPorId(id) {
    return armarVenta(getPool(), id);
  },

  /** Anula una venta y devuelve las unidades al inventario. */
  async anular(id, idUsuario) {
    return conTransaccion(async (cx) => {
      const [cabeceras] = await cx.query(
        'SELECT id_venta, estado FROM ventas WHERE id_venta = ? FOR UPDATE',
        [id]
      );
      if (!cabeceras.length) throw errorNoEncontrado(`No existe la venta con id ${id}.`);
      if (cabeceras[0].estado === 'anulada') {
        throw errorConflicto(`La venta #${id} ya se encuentra anulada.`);
      }

      const [detalles] = await cx.query(
        'SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = ?',
        [id]
      );
      for (const d of detalles) {
        await cx.query(
          'UPDATE productos SET stock_actual = stock_actual + ? WHERE id_producto = ?',
          [d.cantidad, d.id_producto]
        );
        await cx.query(
          `INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, id_usuario)
           VALUES (?, 'entrada', ?, ?, ?)`,
          [d.id_producto, d.cantidad, `Anulacion de venta #${id}`, idUsuario]
        );
      }

      await cx.query("UPDATE ventas SET estado = 'anulada' WHERE id_venta = ?", [id]);
      return armarVenta(cx, id);
    });
  },

  /**
   * CU-04 / RF-09: resumen de ventas del periodo.
   * Solo suma ventas en estado "registrada".
   */
  async resumenPorPeriodo({ desde = null, hasta = null } = {}) {
    const { condiciones, parametros } = clausulaRango('v.fecha_hora', desde, hasta);
    condiciones.push("v.estado = 'registrada'");
    const where = `WHERE ${condiciones.join(' AND ')}`;

    const [[totales]] = await getPool().query(
      `SELECT COALESCE(SUM(v.total), 0) AS total_vendido,
              COUNT(*)                  AS cantidad_ventas
       FROM ventas v ${where}`,
      parametros
    );

    const [porMedioPago] = await getPool().query(
      `SELECT mp.nombre AS medio_pago,
              COUNT(*)  AS cantidad,
              COALESCE(SUM(v.total), 0) AS total
       FROM ventas v
       JOIN medios_pago mp ON mp.id_medio_pago = v.id_medio_pago
       ${where}
       GROUP BY mp.id_medio_pago, mp.nombre
       ORDER BY total DESC`,
      parametros
    );

    const [porProducto] = await getPool().query(
      `SELECT p.id_producto, p.nombre,
              SUM(d.cantidad) AS cantidad,
              SUM(d.subtotal) AS total
       FROM detalle_venta d
       JOIN ventas v    ON v.id_venta = d.id_venta
       JOIN productos p ON p.id_producto = d.id_producto
       ${where}
       GROUP BY p.id_producto, p.nombre
       ORDER BY cantidad DESC`,
      parametros
    );

    const totalVendido = Number(totales.total_vendido);
    const cantidadVentas = Number(totales.cantidad_ventas);

    return {
      desde,
      hasta,
      total_vendido: Math.round(totalVendido * 100) / 100,
      cantidad_ventas: cantidadVentas,
      ticket_promedio:
        cantidadVentas > 0 ? Math.round((totalVendido / cantidadVentas) * 100) / 100 : 0,
      medios_pago: porMedioPago.map((m) => ({ ...m, total: Number(m.total) })),
      productos: porProducto.map((p) => ({
        ...p,
        cantidad: Number(p.cantidad),
        total: Number(p.total),
      })),
    };
  },

  /** CU-05 / RF-10: ranking de productos mas vendidos. */
  async masVendidos({ desde = null, hasta = null, limite = 10 } = {}) {
    const { condiciones, parametros } = clausulaRango('v.fecha_hora', desde, hasta);
    condiciones.push("v.estado = 'registrada'");
    parametros.push(limite);

    const [filas] = await getPool().query(
      `SELECT p.id_producto, p.nombre,
              SUM(d.cantidad) AS cantidad,
              SUM(d.subtotal) AS total
       FROM detalle_venta d
       JOIN ventas v    ON v.id_venta = d.id_venta
       JOIN productos p ON p.id_producto = d.id_producto
       WHERE ${condiciones.join(' AND ')}
       GROUP BY p.id_producto, p.nombre
       ORDER BY cantidad DESC, total DESC
       LIMIT ?`,
      parametros
    );

    return filas.map((f, indice) => ({
      posicion: indice + 1,
      id_producto: f.id_producto,
      nombre: f.nombre,
      cantidad: Number(f.cantidad),
      total: Math.round(Number(f.total) * 100) / 100,
    }));
  },
};

const bajas = {
  /**
   * CU-03 / RF-11 y RF-12: registra la baja y descuenta el stock
   * en una unica transaccion. FA-1: si la cantidad supera el stock
   * disponible se revierte todo y se informa el error.
   */
  async registrar({ id_producto, cantidad, motivo, id_usuario }) {
    return conTransaccion(async (cx) => {
      const [filas] = await cx.query(
        'SELECT id_producto, nombre, stock_actual FROM productos WHERE id_producto = ? FOR UPDATE',
        [id_producto]
      );
      if (!filas.length) {
        throw errorNoEncontrado(`No existe el producto con id ${id_producto}.`);
      }

      const producto = filas[0];
      const unidades = Number(cantidad);
      if (unidades > producto.stock_actual) {
        throw errorStockInsuficiente(producto.nombre, unidades, producto.stock_actual);
      }

      await cx.query(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?',
        [unidades, id_producto]
      );

      const [resultado] = await cx.query(
        `INSERT INTO bajas_producto (id_producto, cantidad, motivo, fecha_hora, id_usuario)
         VALUES (?, ?, ?, NOW(), ?)`,
        [id_producto, unidades, motivo, id_usuario]
      );

      await cx.query(
        `INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, id_usuario)
         VALUES (?, 'baja', ?, ?, ?)`,
        [id_producto, unidades, `Baja por producto ${motivo}`, id_usuario]
      );

      const [creada] = await cx.query(
        `SELECT b.*, p.nombre AS nombre_producto
         FROM bajas_producto b
         JOIN productos p ON p.id_producto = b.id_producto
         WHERE b.id_baja = ?`,
        [resultado.insertId]
      );
      return new BajaProducto(creada[0]);
    });
  },

  async listar({ desde = null, hasta = null, limite = 100 } = {}) {
    const { condiciones, parametros } = clausulaRango('b.fecha_hora', desde, hasta);
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    parametros.push(limite);

    const [filas] = await getPool().query(
      `SELECT b.*, p.nombre AS nombre_producto
       FROM bajas_producto b
       JOIN productos p ON p.id_producto = b.id_producto
       ${where}
       ORDER BY b.fecha_hora DESC
       LIMIT ?`,
      parametros
    );
    return filas.map((f) => new BajaProducto(f));
  },
};

/** Construye el conjunto de repositorios MySQL. */
export function crearRepositoriosMySQL() {
  return { usuarios, categorias, mediosPago, productos, ventas, movimientos, bajas };
}
