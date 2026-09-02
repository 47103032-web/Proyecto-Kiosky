/**
 * Producto - Representa articulos del inventario.
 * Entregable N2, punto 13: actualizarStock(), estaBajoStock(), estaVencido().
 */
export class Producto {
  constructor({
    id_producto,
    codigo_barra = null,
    nombre,
    descripcion = null,
    precio,
    stock_actual = 0,
    stock_minimo = 0,
    fecha_vencimiento = null,
    id_categoria = null,
    categoria = null,
    activo = true,
  }) {
    this.id = id_producto;
    this.codigoBarra = codigo_barra;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = Number(precio);
    this.stockActual = Number(stock_actual);
    this.stockMinimo = Number(stock_minimo);
    this.fechaVencimiento = fecha_vencimiento;
    this.idCategoria = id_categoria;
    this.categoria = categoria;
    this.activo = Boolean(activo);
  }

  /**
   * Aplica un delta al stock. Un delta negativo descuenta.
   * No permite dejar el stock por debajo de cero (regla de integridad 12).
   */
  actualizarStock(delta) {
    const nuevo = this.stockActual + delta;
    if (nuevo < 0) {
      throw new Error(
        `La operacion dejaria el stock de "${this.nombre}" en ${nuevo}.`
      );
    }
    this.stockActual = nuevo;
    return this.stockActual;
  }

  /** RF-13: el stock esta en o por debajo del minimo configurado. */
  estaBajoStock() {
    return this.stockActual <= this.stockMinimo;
  }

  /** CU-03: la fecha de vencimiento ya paso. */
  estaVencido(referencia = new Date()) {
    if (!this.fechaVencimiento) return false;
    return new Date(this.fechaVencimiento) < soloFecha(referencia);
  }

  /** Vence dentro de los proximos `dias` (alerta del dashboard). */
  estaProximoAVencer(dias = 30, referencia = new Date()) {
    if (!this.fechaVencimiento) return false;
    const vencimiento = new Date(this.fechaVencimiento);
    const hoy = soloFecha(referencia);
    if (vencimiento < hoy) return false;
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + dias);
    return vencimiento <= limite;
  }

  toJSON() {
    return {
      id_producto: this.id,
      codigo_barra: this.codigoBarra,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      stock_actual: this.stockActual,
      stock_minimo: this.stockMinimo,
      fecha_vencimiento: this.fechaVencimiento,
      id_categoria: this.idCategoria,
      categoria: this.categoria,
      activo: this.activo,
      bajo_stock: this.estaBajoStock(),
      vencido: this.estaVencido(),
    };
  }
}

/** Normaliza a medianoche para comparar fechas sin la parte horaria. */
function soloFecha(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}
