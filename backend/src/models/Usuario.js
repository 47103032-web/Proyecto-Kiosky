/**
 * Usuario - Representa a propietarios y empleados.
 * Entregable N2, punto 13: validarRol(), estaActivo().
 */
export class Usuario {
  constructor({ id_usuario, nombre, email, password_hash, rol = 'empleado', activo = true }) {
    this.id = id_usuario;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = password_hash;
    this.rol = rol;
    this.activo = Boolean(activo);
  }

  validarRol(rolEsperado) {
    return this.rol === rolEsperado;
  }

  esPropietario() {
    return this.rol === 'propietario';
  }

  estaActivo() {
    return this.activo === true;
  }

  /** Serializacion publica: nunca expone el hash de contrasena. */
  toJSON() {
    return {
      id_usuario: this.id,
      nombre: this.nombre,
      email: this.email,
      rol: this.rol,
      activo: this.activo,
    };
  }
}
