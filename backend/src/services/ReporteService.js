/**
 * ReporteService - Reportes y estadisticas (CU-04, CU-05, RF-09, RF-10).
 * Entregable N2, punto 13: ventasPorPeriodo(), productosMasVendidos().
 */
import { config } from '../config/env.js';
import { getRepositorios } from '../repositories/index.js';
import { errorValidacion } from '../utils/errors.js';

const PERIODOS = ['dia', 'semana', 'mes'];

/** Devuelve 'YYYY-MM-DD' de una fecha local. */
function aFechaISO(fecha) {
  const p = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

/**
 * Traduce un periodo a un rango de fechas concreto.
 *
 * Se usan ventanas moviles terminadas en el dia de hoy:
 *   dia    -> hoy
 *   semana -> ultimos 7 dias (hoy incluido)
 *   mes    -> ultimos 30 dias (hoy incluido)
 *
 * La ventana movil se eligio sobre el calendario natural para que los
 * reportes den siempre el mismo resultado sin depender del dia de la
 * semana en que se ejecuten las pruebas.
 */
export function rangoDePeriodo(periodo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const dias = { dia: 0, semana: 6, mes: 29 }[periodo];
  if (dias === undefined) {
    throw errorValidacion(`Periodo invalido. Valores admitidos: ${PERIODOS.join(', ')}.`);
  }

  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - dias);
  return { desde: aFechaISO(desde), hasta: aFechaISO(hoy) };
}

/**
 * Resuelve el rango a consultar: si llegan desde/hasta explicitos se usan
 * esos; si no, se deriva del periodo solicitado (por defecto, el dia).
 */
export function resolverRango({ periodo, desde, hasta }) {
  if (desde || hasta) {
    const formato = /^\d{4}-\d{2}-\d{2}$/;
    if (desde && !formato.test(desde)) {
      throw errorValidacion('La fecha "desde" debe tener formato AAAA-MM-DD.');
    }
    if (hasta && !formato.test(hasta)) {
      throw errorValidacion('La fecha "hasta" debe tener formato AAAA-MM-DD.');
    }
    if (desde && hasta && desde > hasta) {
      throw errorValidacion('La fecha "desde" no puede ser posterior a la fecha "hasta".');
    }
    return { desde: desde ?? null, hasta: hasta ?? null };
  }
  return rangoDePeriodo(periodo ?? 'dia');
}

/**
 * CU-04 / RF-09: reporte de ventas del periodo.
 * Si no hay ventas, devuelve el resumen en cero con `sin_datos: true`
 * para que el frontend muestre el mensaje del flujo alternativo.
 */
export async function ventasPorPeriodo({ periodo, desde, hasta } = {}) {
  const rango = resolverRango({ periodo, desde, hasta });
  const { ventas } = getRepositorios();

  const resumen = await ventas.resumenPorPeriodo(rango);
  return {
    ...resumen,
    periodo: periodo ?? (desde || hasta ? 'personalizado' : 'dia'),
    sin_datos: resumen.cantidad_ventas === 0,
  };
}

/**
 * CU-05 / RF-10: ranking de productos mas vendidos.
 * Flujo alternativo: sin ventas en el periodo devuelve `sin_datos: true`.
 */
export async function productosMasVendidos({ periodo, desde, hasta, limite = 10 } = {}) {
  const rango = resolverRango({ periodo, desde, hasta });
  const { ventas } = getRepositorios();

  const ranking = await ventas.masVendidos({ ...rango, limite: Number(limite) });
  return {
    ...rango,
    periodo: periodo ?? (desde || hasta ? 'personalizado' : 'mes'),
    ranking,
    sin_datos: ranking.length === 0,
  };
}

/**
 * KIO-07: datos del dashboard principal.
 * Reune ventas del dia, bajo stock, proximos a vencer y vencidos.
 */
export async function obtenerDashboard() {
  const { ventas, productos } = getRepositorios();
  const hoy = rangoDePeriodo('dia');

  const [resumenHoy, bajoStock, proximosAVencer, vencidos, masVendidos] = await Promise.all([
    ventas.resumenPorPeriodo(hoy),
    productos.bajoStock(),
    productos.proximosAVencer(config.diasProximoVencimiento),
    productos.vencidos(),
    ventas.masVendidos({ ...rangoDePeriodo('mes'), limite: 5 }),
  ]);

  return {
    fecha: hoy.hasta,
    ventas_del_dia: {
      total_vendido: resumenHoy.total_vendido,
      cantidad_ventas: resumenHoy.cantidad_ventas,
      ticket_promedio: resumenHoy.ticket_promedio,
      medios_pago: resumenHoy.medios_pago,
    },
    bajo_stock: bajoStock.map((p) => p.toJSON()),
    proximos_a_vencer: proximosAVencer.map((p) => p.toJSON()),
    vencidos: vencidos.map((p) => p.toJSON()),
    mas_vendidos_del_mes: masVendidos,
    dias_proximo_vencimiento: config.diasProximoVencimiento,
  };
}
