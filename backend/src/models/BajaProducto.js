/**
 * BajaProducto - Registra vencidos o danados (CU-03).
 * Entregable N2, punto 13: validarCantidad(), aplicarBaja().
 */
export class BajaProducto {
  constructor({
    id_baja = null,
    id_producto,
    cantidad,
    motivo,
    fecha_hora = null,
    id_usuario,
    nombre_producto = null,
  }) {
    this.id = id_baja;
    this.idProducto = id_producto;
    this.nombreProducto = nombre_producto;
    this.cantidad = Number(cantidad);
    this.motivo = motivo;
    this.fechaHora = fecha_hora;
    this.idUsuario = id_usuario;
  }

  /**
   * CU-03 FA-1: la cantidad debe ser positiva y no superar el stock.
   * Devuelve un mensaje de error o null si es valida.
   */
  validarCantidad(stockDisponible) {
    if (!Number.isInteger(this.cantidad) || this.cantidad <= 0) {
      return 'La cantidad debe ser un numero entero mayor a cero.';
    }
    if (this.cantidad > stockDisponible) {
      return `La cantidad (${this.cantidad}) supera el stock disponible (${stockDisponible}).`;
    }
    return null;
  }

  /** Descuenta del producto las unidades dadas de baja. */
  aplicarBaja(producto) {
    producto.actualizarStock(-this.cantidad);
    return producto.stockActual;
  }

  toJSON() {
    return {
      id_baja: this.id,
      id_producto: this.idProducto,
      nombre_producto: this.nombreProducto,
      cantidad: this.cantidad,
      motivo: this.motivo,
      fecha_hora: this.fechaHora,
      id_usuario: this.idUsuario,
    };
  }
}

export const MOTIVOS_BAJA = ['vencido', 'danado', 'otro'];
