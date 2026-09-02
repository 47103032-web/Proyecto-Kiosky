/**
 * Dashboard Principal (KIO-07).
 * Wireframe: ventas del dia, productos con stock bajo, productos
 * proximos a vencer, accesos rapidos e indicadores generales.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Mensaje from '../components/Mensaje.jsx';
import Indicador from '../components/Indicador.jsx';
import { formatearMoneda, formatearFecha, diasHasta } from '../utils/formato.js';

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((r) => setDatos(r.dashboard))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Mensaje tipo="error" texto={error} />;
  if (!datos) return <p>Cargando informacion del negocio...</p>;

  const { ventas_del_dia: ventas } = datos;

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Dashboard</h1>
        <p>Resumen del negocio al {formatearFecha(datos.fecha)}</p>
      </header>

      <div className="grilla" style={{ marginBottom: 18 }}>
        <Indicador
          etiqueta="Vendido hoy"
          valor={formatearMoneda(ventas.total_vendido)}
          tono="exito"
        />
        <Indicador etiqueta="Ventas del dia" valor={ventas.cantidad_ventas} />
        <Indicador etiqueta="Ticket promedio" valor={formatearMoneda(ventas.ticket_promedio)} />
        <Indicador
          etiqueta="Productos con stock bajo"
          valor={datos.bajo_stock.length}
          tono={datos.bajo_stock.length > 0 ? 'alerta' : ''}
        />
        <Indicador
          etiqueta="Proximos a vencer"
          valor={datos.proximos_a_vencer.length}
          tono={datos.proximos_a_vencer.length > 0 ? 'alerta' : ''}
        />
        <Indicador
          etiqueta="Vencidos"
          valor={datos.vencidos.length}
          tono={datos.vencidos.length > 0 ? 'error' : ''}
        />
      </div>

      <div className="panel">
        <h2>Accesos rapidos</h2>
        <div className="acciones">
          <Link to="/venta">
            <button>Nueva venta</button>
          </Link>
          <Link to="/productos">
            <button className="secundario">Administrar productos</button>
          </Link>
          <Link to="/vencidos">
            <button className="secundario">Registrar producto vencido</button>
          </Link>
          <Link to="/reportes">
            <button className="secundario">Ver reportes</button>
          </Link>
        </div>
      </div>

      <div className="grilla">
        <div className="panel">
          <h2>Productos con stock bajo</h2>
          <TablaAlerta
            filas={datos.bajo_stock}
            vacio="No hay productos por debajo del stock minimo."
            columnas={['Producto', 'Stock', 'Minimo']}
            render={(p) => (
              <tr key={p.id_producto}>
                <td>{p.nombre}</td>
                <td className="numero">
                  <span className={`etiqueta ${p.stock_actual === 0 ? 'critica' : 'aviso'}`}>
                    {p.stock_actual}
                  </span>
                </td>
                <td className="numero">{p.stock_minimo}</td>
              </tr>
            )}
          />
        </div>

        <div className="panel">
          <h2>Proximos a vencer ({datos.dias_proximo_vencimiento} dias)</h2>
          <TablaAlerta
            filas={datos.proximos_a_vencer}
            vacio="No hay productos proximos a vencer."
            columnas={['Producto', 'Vence', 'Faltan']}
            render={(p) => (
              <tr key={p.id_producto}>
                <td>{p.nombre}</td>
                <td>{formatearFecha(p.fecha_vencimiento)}</td>
                <td className="numero">
                  <span className="etiqueta aviso">{diasHasta(p.fecha_vencimiento)} dias</span>
                </td>
              </tr>
            )}
          />
        </div>

        <div className="panel">
          <h2>Productos vencidos</h2>
          <TablaAlerta
            filas={datos.vencidos}
            vacio="No hay productos vencidos en el inventario."
            columnas={['Producto', 'Vencio', 'Stock']}
            render={(p) => (
              <tr key={p.id_producto}>
                <td>{p.nombre}</td>
                <td>{formatearFecha(p.fecha_vencimiento)}</td>
                <td className="numero">
                  <span className="etiqueta critica">{p.stock_actual}</span>
                </td>
              </tr>
            )}
          />
        </div>

        <div className="panel">
          <h2>Mas vendidos del mes</h2>
          <TablaAlerta
            filas={datos.mas_vendidos_del_mes}
            vacio="Todavia no hay ventas registradas."
            columnas={['#', 'Producto', 'Unidades']}
            render={(p) => (
              <tr key={p.id_producto}>
                <td>{p.posicion}</td>
                <td>{p.nombre}</td>
                <td className="numero">{p.cantidad}</td>
              </tr>
            )}
          />
        </div>
      </div>
    </>
  );
}

/** Tabla compacta para los paneles de alertas del dashboard. */
function TablaAlerta({ filas, columnas, render, vacio }) {
  if (!filas || filas.length === 0) {
    return <p className="vacio">{vacio}</p>;
  }
  return (
    <div className="tabla-contenedor">
      <table>
        <thead>
          <tr>
            {columnas.map((c, i) => (
              <th key={c} className={i > 0 ? 'numero' : ''}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{filas.map(render)}</tbody>
      </table>
    </div>
  );
}
