/** AuthController - RF-01, inicio de sesion. */
import * as AuthService from '../services/AuthService.js';
import { getRepositorios } from '../repositories/index.js';
import { errorNoAutorizado } from '../utils/errors.js';

export async function login(req, res, siguiente) {
  try {
    const { email, password } = req.body ?? {};
    const resultado = await AuthService.login(email, password);
    res.json({ ok: true, ...resultado });
  } catch (error) {
    siguiente(error);
  }
}

/** Devuelve el usuario de la sesion actual. */
export async function perfil(req, res, siguiente) {
  try {
    const { usuarios } = getRepositorios();
    const usuario = await usuarios.buscarPorId(req.usuario.id);
    if (!usuario) throw errorNoAutorizado('La sesion ya no es valida.');
    res.json({ ok: true, usuario: usuario.toJSON() });
  } catch (error) {
    siguiente(error);
  }
}
