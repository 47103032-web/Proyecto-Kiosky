/**
 * Protege las rutas internas.
 * Sin sesion redirige al login; si la ruta exige rol propietario y el
 * usuario es empleado, lo devuelve al dashboard.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from './Layout.jsx';

export default function RutaProtegida({ children, soloPropietario = false }) {
  const { usuario, cargando, esPropietario } = useAuth();

  if (cargando) {
    return <div style={{ padding: 40 }}>Cargando...</div>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (soloPropietario && !esPropietario) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}
