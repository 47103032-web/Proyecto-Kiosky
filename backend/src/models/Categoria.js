/** Categoria - Agrupa productos por rubro. */
export class Categoria {
  constructor({ id_categoria, nombre, descripcion = null, activo = true }) {
    this.id = id_categoria;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.activo = Boolean(activo);
  }

  activar() {
    this.activo = true;
  }

  desactivar() {
    this.activo = false;
  }

  toJSON() {
    return {
      id_categoria: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      activo: this.activo,
    };
  }
}
