/** MovimientoStock - Trazabilidad del inventario. */
export class MovimientoStock {
  constructor({
    id_movimiento = null,
    id_producto,
    tipo,
    cantidad,
    motivo = null,
    fecha_hora = null,
    id_usuario,
    nombre_producto = null,
  }) {
    this.id = id_movimiento;
    this.idProducto = id_producto;
    this.nombreProducto = nombre_producto;
    this.tipo = tipo;
    this.cantidad = Number(cantidad);
    this.motivo = motivo;
    this.fechaHora = fecha_hora;
    this.idUsuario = id_usuario;
  }

  toJSON() {
    return {
      id_movimiento: this.id,
      id_producto: this.idProducto,
      nombre_producto: this.nombreProducto,
      tipo: this.tipo,
      cantidad: this.cantidad,
      motivo: this.motivo,
      fecha_hora: this.fechaHora,
      id_usuario: this.idUsuario,
    };
  }
}

export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste', 'venta', 'baja'];
