/**
 * DetalleVenta - Producto y cantidad dentro de una venta.
 * Regla de integridad 12: subtotal = cantidad * precio_unitario.
 */
export class DetalleVenta {
  constructor({ id_detalle = null, id_venta = null, id_producto, nombre = null, cantidad, precio_unitario }) {
    this.id = id_detalle;
    this.idVenta = id_venta;
    this.idProducto = id_producto;
    this.nombre = nombre;
    this.cantidad = Number(cantidad);
    this.precioUnitario = Number(precio_unitario);
    this.subtotal = this.calcularSubtotal();
  }

  calcularSubtotal() {
    return redondear(this.cantidad * this.precioUnitario);
  }

  toJSON() {
    return {
      id_detalle: this.id,
      id_venta: this.idVenta,
      id_producto: this.idProducto,
      nombre: this.nombre,
      cantidad: this.cantidad,
      precio_unitario: this.precioUnitario,
      subtotal: this.subtotal,
    };
  }
}

/** Redondeo a 2 decimales, coherente con DECIMAL(10,2) en MySQL. */
export function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
