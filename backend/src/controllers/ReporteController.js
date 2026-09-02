/** ReporteController - CU-04, CU-05, RF-09, RF-10 y dashboard (KIO-07). */
import * as ReporteService from '../services/ReporteService.js';

export async function ventas(req, res, siguiente) {
  try {
    const { periodo, desde, hasta } = req.query;
    const reporte = await ReporteService.ventasPorPeriodo({ periodo, desde, hasta });
    res.json({
      ok: true,
      mensaje: reporte.sin_datos
        ? 'No hay ventas registradas en el periodo seleccionado.'
        : undefined,
      reporte,
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function masVendidos(req, res, siguiente) {
  try {
    const { periodo, desde, hasta, limite } = req.query;
    const resultado = await ReporteService.productosMasVendidos({
      periodo,
      desde,
      hasta,
      limite: limite ?? 10,
    });
    res.json({
      ok: true,
      mensaje: resultado.sin_datos
        ? 'No existen ventas registradas para el periodo seleccionado.'
        : undefined,
      ...resultado,
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function dashboard(_req, res, siguiente) {
  try {
    const datos = await ReporteService.obtenerDashboard();
    res.json({ ok: true, dashboard: datos });
  } catch (error) {
    siguiente(error);
  }
}
