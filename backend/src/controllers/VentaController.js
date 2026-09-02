/** VentaController - CU-01, RF-02, RF-03, RF-08, RF-14. */
import * as VentaService from '../services/VentaService.js';

export async function registrar(req, res, siguiente) {
  try {
    const { items, id_medio_pago } = req.body ?? {};
    const venta = await VentaService.registrarVenta({
      items,
      id_medio_pago,
      id_usuario: req.usuario.id,
    });
    res.status(201).json({
      ok: true,
      mensaje: `Venta #${venta.id} registrada correctamente.`,
      venta: venta.toJSON(),
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function listar(req, res, siguiente) {
  try {
    const { desde, hasta, estado } = req.query;
    const ventas = await VentaService.listarVentas({ desde, hasta, estado });
    res.json({ ok: true, total: ventas.length, ventas: ventas.map((v) => v.toJSON()) });
  } catch (error) {
    siguiente(error);
  }
}

export async function obtener(req, res, siguiente) {
  try {
    const venta = await VentaService.obtenerVenta(req.params.id);
    res.json({ ok: true, venta: venta.toJSON() });
  } catch (error) {
    siguiente(error);
  }
}

export async function anular(req, res, siguiente) {
  try {
    const venta = await VentaService.anularVenta(req.params.id, req.usuario.id);
    res.json({
      ok: true,
      mensaje: `Venta #${venta.id} anulada. El stock fue repuesto.`,
      venta: venta.toJSON(),
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function listarMediosPago(_req, res, siguiente) {
  try {
    const medios = await VentaService.listarMediosPago();
    res.json({ ok: true, medios_pago: medios.map((m) => m.toJSON()) });
  } catch (error) {
    siguiente(error);
  }
}
