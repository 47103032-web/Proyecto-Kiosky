/** MedioPago - Representa formas de cobro (RF-08). */
export class MedioPago {
  constructor({ id_medio_pago, nombre, activo = true }) {
    this.id = id_medio_pago;
    this.nombre = nombre;
    this.activo = Boolean(activo);
  }

  habilitar() {
    this.activo = true;
  }

  deshabilitar() {
    this.activo = false;
  }

  toJSON() {
    return {
      id_medio_pago: this.id,
      nombre: this.nombre,
      activo: this.activo,
    };
  }
}
