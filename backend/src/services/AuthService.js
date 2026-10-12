/**
 * AuthService - Gestiona el inicio de sesion (RF-01, CU previo a todos).
 * Entregable N2, punto 13: login(), validarCredenciales().
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getRepositorios } from '../repositories/index.js';
import {
  errorNoAutorizado,
  errorSesionVencida,
  errorValidacion,
} from '../utils/errors.js';
import { limpiarIntentos, registrarFallo } from '../middleware/limiteIntentos.js';

/**
 * Valida las credenciales y devuelve el usuario si son correctas.
 * Devuelve siempre el mismo mensaje ante email inexistente o contrasena
 * incorrecta, para no revelar que cuentas existen (RNF-04).
 */
export async function validarCredenciales(email, password) {
  const { usuarios } = getRepositorios();

  const usuario = await usuarios.buscarPorEmail(email);
  if (!usuario) throw errorNoAutorizado('Usuario o contrasena incorrectos.');

  const coincide = await bcrypt.compare(password, usuario.passwordHash);
  if (!coincide) throw errorNoAutorizado('Usuario o contrasena incorrectos.');

  if (!usuario.estaActivo()) {
    throw errorNoAutorizado('El usuario se encuentra deshabilitado.');
  }
  return usuario;
}

/** Realiza el login y devuelve el token JWT junto con el usuario. */
export async function login(email, password) {
  if (!email || !password) {
    throw errorValidacion('Debe ingresar usuario y contrasena.', {
      email: !email ? 'Requerido' : undefined,
      password: !password ? 'Requerido' : undefined,
    });
  }

  // Un intento fallido alimenta el limite por email (AUD-10); uno correcto
  // libera la cuenta, para no castigar a quien se equivoco y despues acerto.
  let usuario;
  try {
    usuario = await validarCredenciales(email, password);
  } catch (error) {
    registrarFallo(email);
    throw error;
  }
  limpiarIntentos(email);

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return { token, usuario: usuario.toJSON() };
}

/** Verifica un token emitido por el sistema. */
export function verificarToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    throw errorSesionVencida();
  }
}
