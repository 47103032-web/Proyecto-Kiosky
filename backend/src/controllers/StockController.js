/** StockController - CU-03, RF-11, RF-12, RF-13. */
import * as StockService from '../services/StockService.js';

export async function registrarBaja(req, res, siguiente) {
  try {
    const { id_producto, cantidad, motivo } = req.body ?? {};
    const baja = await StockService.registrarBaja({
      id_producto,
      cantidad,
      motivo,
      id_usuario: req.usuario.id,
    });
    res.status(201).json({
      ok: true,
      mensaje: `Se dieron de baja ${baja.cantidad} unidad(es) de "${baja.nombreProducto}".`,
      baja: baja.toJSON(),
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function listarBajas(req, res, siguiente) {
  try {
    const { desde, hasta } = req.query;
    const bajas = await StockService.listarBajas({ desde, hasta });
    res.json({ ok: true, total: bajas.length, bajas: bajas.map((b) => b.toJSON()) });
  } catch (error) {
    siguiente(error);
  }
}

export async function alertas(_req, res, siguiente) {
  try {
    const [bajoStock, proximos, vencidos] = await Promise.all([
      StockService.productosBajoStock(),
      StockService.productosProximosAVencer(),
      StockService.productosVencidos(),
    ]);
    res.json({
      ok: true,
      bajo_stock: bajoStock.map((p) => p.toJSON()),
      proximos_a_vencer: proximos.map((p) => p.toJSON()),
      vencidos: vencidos.map((p) => p.toJSON()),
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function listarMovimientos(req, res, siguiente) {
  try {
    const { producto } = req.query;
    const movimientos = await StockService.listarMovimientos({ idProducto: producto });
    res.json({ ok: true, movimientos: movimientos.map((m) => m.toJSON()) });
  } catch (error) {
    siguiente(error);
  }
}
