/** Definicion de rutas de la aplicacion. */
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Productos from './pages/Productos.jsx';
import RegistrarVenta from './pages/RegistrarVenta.jsx';
import ProductosVencidos from './pages/ProductosVencidos.jsx';
import Reportes from './pages/Reportes.jsx';
import MasVendidos from './pages/MasVendidos.jsx';
import HistorialVentas from './pages/HistorialVentas.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route
        path="/venta"
        element={
          <RutaProtegida>
            <RegistrarVenta />
          </RutaProtegida>
        }
      />
      <Route
        path="/productos"
        element={
          <RutaProtegida>
            <Productos />
          </RutaProtegida>
        }
      />
      <Route
        path="/historial"
        element={
          <RutaProtegida>
            <HistorialVentas />
          </RutaProtegida>
        }
      />

      {/* Pantallas cuyo actor principal es el propietario (CU-03, CU-04, CU-05). */}
      <Route
        path="/vencidos"
        element={
          <RutaProtegida soloPropietario>
            <ProductosVencidos />
          </RutaProtegida>
        }
      />
      <Route
        path="/reportes"
        element={
          <RutaProtegida soloPropietario>
            <Reportes />
          </RutaProtegida>
        }
      />
      <Route
        path="/mas-vendidos"
        element={
          <RutaProtegida soloPropietario>
            <MasVendidos />
          </RutaProtegida>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
