/**
 * Pantalla de Inicio de Sesion (RF-01).
 * Wireframe: logo, campo usuario, campo contrasena, boton y mensajes
 * de validacion.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Mensaje from '../components/Mensaje.jsx';

export default function Login() {
  const { usuario, login, cargando } = useAuth();
  const navegar = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return <div style={{ padding: 40 }}>Cargando...</div>;
  if (usuario) return <Navigate to="/" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);

    // Validacion en el cliente antes de llamar a la API.
    if (!email.trim() || !password) {
      setError({ mensaje: 'Debe completar usuario y contrasena.' });
      return;
    }

    setEnviando(true);
    try {
      await login(email.trim(), password);
      navegar('/');
    } catch (e) {
      setError({ mensaje: e.message, detalles: e.detalles });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla-login">
      <form className="caja-login" onSubmit={enviar}>
        <div className="marca">
          KIOS<span>KY</span>
        </div>
        <p className="subtitulo">Gestion integral de kioscos</p>

        <Mensaje tipo="error" texto={error?.mensaje} detalles={error?.detalles} />

        <div className="campo">
          <label htmlFor="email">Usuario</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="usuario@kiosky.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Iniciar sesion'}
        </button>

        <div className="credenciales-demo">
          <strong>Usuarios de prueba</strong>
          <br />
          Propietario: propietario@kiosky.com / Kiosky2026
          <br />
          Empleado: empleado@kiosky.com / Empleado2026
        </div>
      </form>
    </div>
  );
}
