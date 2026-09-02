/**
 * Estructura comun de las pantallas internas: menu lateral + contenido.
 * El menu se arma segun el rol: las opciones exclusivas del propietario
 * no se muestran al empleado (coherente con los actores de cada CU).
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const OPCIONES = [
  { a: '/', texto: 'Dashboard', soloPropietario: false },
  { a: '/venta', texto: 'Registrar venta', soloPropietario: false },
  { a: '/productos', texto: 'Productos', soloPropietario: false },
  { a: '/vencidos', texto: 'Productos vencidos', soloPropietario: true },
  { a: '/reportes', texto: 'Reportes', soloPropietario: true },
  { a: '/mas-vendidos', texto: 'Mas vendidos', soloPropietario: true },
  { a: '/historial', texto: 'Historial de ventas', soloPropietario: false },
];

export default function Layout({ children }) {
  const { usuario, logout, esPropietario } = useAuth();
  const navegar = useNavigate();

  function salir() {
    logout();
    navegar('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="marca">
          KIOS<span>KY</span>
        </div>

        <nav>
          {OPCIONES.filter((o) => !o.soloPropietario || esPropietario).map((o) => (
            <NavLink
              key={o.a}
              to={o.a}
              end={o.a === '/'}
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              {o.texto}
            </NavLink>
          ))}
        </nav>

        <div className="pie">
          <div>{usuario?.nombre}</div>
          <div className="rol">{usuario?.rol}</div>
          <button className="secundario chico" style={{ marginTop: 8 }} onClick={salir}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="contenido">{children}</main>
    </div>
  );
}
