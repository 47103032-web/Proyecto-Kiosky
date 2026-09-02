/** ProductoController - CU-02, RF-04 a RF-07. */
import * as ProductoService from '../services/ProductoService.js';

export async function listar(req, res, siguiente) {
  try {
    const { busqueda = '', categoria, incluirInactivos } = req.query;
    const productos = await ProductoService.buscar({
      busqueda,
      idCategoria: categoria ? Number(categoria) : null,
      incluirInactivos: incluirInactivos === 'true',
    });
    res.json({ ok: true, total: productos.length, productos: productos.map((p) => p.toJSON()) });
  } catch (error) {
    siguiente(error);
  }
}

export async function obtener(req, res, siguiente) {
  try {
    const producto = await ProductoService.obtenerPorId(req.params.id);
    res.json({ ok: true, producto: producto.toJSON() });
  } catch (error) {
    siguiente(error);
  }
}

/** CU-01 paso 3: busqueda por codigo de barras. */
export async function obtenerPorCodigo(req, res, siguiente) {
  try {
    const producto = await ProductoService.obtenerPorCodigoBarra(req.params.codigo);
    res.json({ ok: true, producto: producto.toJSON() });
  } catch (error) {
    siguiente(error);
  }
}

export async function crear(req, res, siguiente) {
  try {
    const producto = await ProductoService.crear(req.body ?? {}, req.usuario.id);
    res.status(201).json({
      ok: true,
      mensaje: 'El producto fue registrado correctamente.',
      producto: producto.toJSON(),
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function actualizar(req, res, siguiente) {
  try {
    const producto = await ProductoService.actualizar(req.params.id, req.body ?? {}, req.usuario.id);
    res.json({
      ok: true,
      mensaje: 'Los cambios fueron guardados correctamente.',
      producto: producto.toJSON(),
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function eliminar(req, res, siguiente) {
  try {
    const resultado = await ProductoService.eliminar(req.params.id);
    res.json({
      ok: true,
      mensaje: resultado.desactivado
        ? 'El producto tiene ventas asociadas: se desactivo para conservar el historial.'
        : 'El producto fue eliminado del inventario.',
      ...resultado,
    });
  } catch (error) {
    siguiente(error);
  }
}

export async function listarCategorias(_req, res, siguiente) {
  try {
    const categorias = await ProductoService.listarCategorias();
    res.json({ ok: true, categorias: categorias.map((c) => c.toJSON()) });
  } catch (error) {
    siguiente(error);
  }
}
