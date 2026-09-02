/**
 * Historial de ventas (RF-14).
 * Permite consultar las ventas registradas, ver su detalle y, para el
 * propietario, anular una venta reponiendo el stock.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Mensaje from '../components/Mensaje.jsx';
import { formatearMoneda, formatearFecha } from '../utils/formato.js';

export default function HistorialVentas() {
  const { esPropietario } = useAuth();

  const [ventas, setVentas] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [expandida, setExpandida] = useState(null);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const parametros = new URLSearchParams();
      if (desde) parametros.set('desde', desde);
      if (hasta) parametros.set('hasta', hasta);
      const r = await api.get(`/ventas?${parametros}`);
      setVentas(r.ventas);
    } catch (e) {
      setError(e.message);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function anular(venta) {
    const confirmado = window.confirm(
      `Confirma anular la venta #${venta.id_venta}? El stock sera repuesto.`
    );
    if (!confirmado) return;

    try {
      const r = await api.post(`/ventas/${venta.id_venta}/anular`);
      setExito(r.mensaje);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Historial de ventas</h1>
        <p>Consulte las operaciones registradas y su detalle.</p>
      </header>

      <Mensaje tipo="error" texto={error} />
      <Mensaje tipo="exito" texto={exito} />

      <div className="panel">
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="desde">Desde</label>
            <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="hasta">Hasta</label>
            <input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="campo" style={{ alignSelf: 'end' }}>
            <button
              className="secundario"
              onClick={() => {
                setDesde('');
                setHasta('');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        {ventas.length === 0 ? (
          <p className="vacio">No hay ventas registradas en el periodo seleccionado.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Medio de pago</th>
                  <th>Estado</th>
                  <th className="numero">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <FilaVenta
                    key={v.id_venta}
                    venta={v}
                    expandida={expandida === v.id_venta}
                    alExpandir={() => setExpandida(expandida === v.id_venta ? null : v.id_venta)}
                    puedeAnular={esPropietario && v.estado === 'registrada'}
                    alAnular={() => anular(v)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/** Fila de venta con su detalle desplegable. */
function FilaVenta({ venta, expandida, alExpandir, puedeAnular, alAnular }) {
  return (
    <>
      <tr>
        <td>{venta.id_venta}</td>
        <td>{formatearFecha(venta.fecha_hora, true)}</td>
        <td>{venta.usuario}</td>
        <td>{venta.medio_pago}</td>
        <td>
          <span className={`etiqueta ${venta.estado === 'anulada' ? 'critica' : 'ok'}`}>
            {venta.estado}
          </span>
        </td>
        <td className="numero">{formatearMoneda(venta.total)}</td>
        <td>
          <div className="acciones">
            <button className="secundario chico" onClick={alExpandir}>
              {expandida ? 'Ocultar' : 'Ver detalle'}
            </button>
            {puedeAnular && (
              <button className="peligro chico" onClick={alAnular}>
                Anular
              </button>
            )}
          </div>
        </td>
      </tr>

      {expandida && (
        <tr>
          <td colSpan="7" style={{ background: '#f7f9fd' }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="numero">Cantidad</th>
                  <th className="numero">Precio unitario</th>
                  <th className="numero">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalles.map((d) => (
                  <tr key={d.id_detalle}>
                    <td>{d.nombre}</td>
                    <td className="numero">{d.cantidad}</td>
                    <td className="numero">{formatearMoneda(d.precio_unitario)}</td>
                    <td className="numero">{formatearMoneda(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
