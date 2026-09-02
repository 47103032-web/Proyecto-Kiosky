/**
 * Contexto de sesion.
 * Mantiene el usuario autenticado y expone login/logout a toda la app.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarToken, obtenerToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app, si hay token guardado se recupera la sesion.
  useEffect(() => {
    async function recuperarSesion() {
      if (!obtenerToken()) {
        setCargando(false);
        return;
      }
      try {
        const { usuario: perfil } = await api.get('/auth/perfil');
        setUsuario(perfil);
      } catch {
        guardarToken(null);
      } finally {
        setCargando(false);
      }
    }
    recuperarSesion();
  }, []);

  async function login(email, password) {
    const respuesta = await api.post('/auth/login', { email, password });
    guardarToken(respuesta.token);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }

  function logout() {
    guardarToken(null);
    setUsuario(null);
  }

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      login,
      logout,
      esPropietario: usuario?.rol === 'propietario',
    }),
    [usuario, cargando]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return contexto;
}
