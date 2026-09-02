import { DetalleVenta, redondear } from './DetalleVenta.js';

/**
 * Venta - Representa una operacion comercial.
 * Entregable N2, punto 13: agregarDetalle(), calcularTotal(), confirmar().
 */
export class Venta {
  constructor({
    id_venta = null,
    fecha_hora = null,
    id_usuario,
    id_medio_pago,
    estado = 'registrada',
    detalles = [],
    total = null,
    usuario = null,
    medio_pago = null,
  }) {
    this.id = id_venta;
    this.fechaHora = fecha_hora;
    this.idUsuario = id_usuario;
    this.idMedioPago = id_medio_pago;
    this.estado = estado;
    this.usuario = usuario;
    this.medioPago = medio_pago;
    this.detalles = detalles.map((d) => (d instanceof DetalleVenta ? d : new DetalleVenta(d)));
    this.total = total !== null ? Number(total) : this.calcularTotal();
  }

  agregarDetalle(detalle) {
    const item = detalle instanceof DetalleVenta ? detalle : new DetalleVenta(detalle);
    this.detalles.push(item);
    this.total = this.calcularTotal();
    return item;
  }

  /** Regla de integridad 12: total = suma de los subtotales. */
  calcularTotal() {
    return redondear(this.detalles.reduce((acc, d) => acc + d.subtotal, 0));
  }

  /** Regla de integridad 12: cada venta debe tener al menos un detalle. */
  confirmar() {
    if (this.detalles.length === 0) {
      throw new Error('La venta debe incluir al menos un producto.');
    }
    this.total = this.calcularTotal();
    this.estado = 'registrada';
    return this;
  }

  estaAnulada() {
    return this.estado === 'anulada';
  }

  toJSON() {
    return {
      id_venta: this.id,
      fecha_hora: this.fechaHora,
      total: this.total,
      id_usuario: this.idUsuario,
      usuario: this.usuario,
      id_medio_pago: this.idMedioPago,
      medio_pago: this.medioPago,
      estado: this.estado,
      detalles: this.detalles.map((d) => d.toJSON()),
    };
  }
}
