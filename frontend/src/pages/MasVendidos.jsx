/**
 * Productos mas vendidos (CU-05, RF-10).
 * Ranking ordenado por cantidad vendida, filtrable por fechas.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Mensaje from '../components/Mensaje.jsx';
import { formatearMoneda, formatearFecha } from '../utils/formato.js';

export default function MasVendidos() {
  const [periodo, setPeriodo] = useState('mes');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const parametros = new URLSearchParams({ limite: '10' });
      if (desde || hasta) {
        if (desde) parametros.set('desde', desde);
        if (hasta) parametros.set('hasta', hasta);
      } else {
        parametros.set('periodo', periodo);
      }
      setDatos(await api.get(`/reportes/mas-vendidos?${parametros}`));
    } catch (e) {
      setError(e.message);
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [periodo, desde, hasta]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const maximo = datos?.ranking?.[0]?.cantidad ?? 0;

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Productos mas vendidos</h1>
        <p>Ranking por cantidad de unidades, util para planificar las compras.</p>
      </header>

      <Mensaje tipo="error" texto={error} />

      <div className="panel">
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="periodo">Periodo</label>
            <select
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={Boolean(desde || hasta)}
            >
              <option value="dia">Hoy</option>
              <option value="semana">Ultimos 7 dias</option>
              <option value="mes">Ultimos 30 dias</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="desde">Desde</label>
            <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="hasta">Hasta</label>
            <input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="campo" style={{ alignSelf: 'end' }}>
            <div className="acciones">
              <button onClick={consultar} disabled={cargando}>
                {cargando ? 'Consultando...' : 'Consultar'}
              </button>
              <button
                className="secundario"
                onClick={() => {
                  setDesde('');
                  setHasta('');
                }}
              >
                Limpiar fechas
              </button>
            </div>
          </div>
        </div>
      </div>

      {datos?.sin_datos && (
        <Mensaje
          tipo="info"
          texto="No existen ventas registradas para el periodo seleccionado, por lo que no se pueden generar estadisticas."
        />
      )}

      {datos && !datos.sin_datos && (
        <div className="panel">
          <h2>
            Ranking del {formatearFecha(datos.desde)} al {formatearFecha(datos.hasta)}
          </h2>
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th className="numero">Unidades</th>
                  <th className="numero">Total facturado</th>
                  <th style={{ width: '30%' }}>Participacion</th>
                </tr>
              </thead>
              <tbody>
                {datos.ranking.map((p) => (
                  <tr key={p.id_producto}>
                    <td>
                      <strong>{p.posicion}</strong>
                    </td>
                    <td>{p.nombre}</td>
                    <td className="numero">{p.cantidad}</td>
                    <td className="numero">{formatearMoneda(p.total)}</td>
                    <td>
                      <div
                        style={{
                          background: 'var(--color-primario)',
                          height: 10,
                          borderRadius: 999,
                          width: `${maximo ? (p.cantidad / maximo) * 100 : 0}%`,
                          minWidth: 6,
                        }}
                        title={`${p.cantidad} unidades`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
