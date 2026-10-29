/**
 * Reportes de ventas (CU-04, RF-09).
 * Wireframe: seleccion de fechas, total vendido, productos mas
 * vendidos, medios de pago y boton Exportar.
 */
import { useCallback, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { api } from '../api/client.js';
import Mensaje from '../components/Mensaje.jsx';
import Indicador from '../components/Indicador.jsx';
import { formatearMoneda, formatearFecha } from '../utils/formato.js';

export default function Reportes() {
  const [periodo, setPeriodo] = useState('dia');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const parametros = new URLSearchParams();
      // Un rango explicito tiene prioridad sobre el periodo predefinido.
      if (desde || hasta) {
        if (desde) parametros.set('desde', desde);
        if (hasta) parametros.set('hasta', hasta);
      } else {
        parametros.set('periodo', periodo);
      }
      const r = await api.get(`/reportes/ventas?${parametros}`);
      setReporte(r.reporte);
    } catch (e) {
      setError(e.message);
      setReporte(null);
    } finally {
      setCargando(false);
    }
  }, [periodo, desde, hasta]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const exportar = () => {
    if (!reporte) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Ventas Kiosky', 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Desde: ${reporte.desde ?? '-'}  |  Hasta: ${reporte.hasta ?? '-'}`,
      14,
      28
    );

    autoTable(doc, {
      startY: 34,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total vendido', `$${reporte.total_vendido ?? 0}`],
        ['Cantidad de ventas', reporte.cantidad_ventas ?? 0],
        ['Ticket promedio', `$${reporte.ticket_promedio ?? 0}`],
      ],
      theme: 'striped',
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Medio de pago', 'Cantidad', 'Total']],
      body: (reporte.medios_pago || []).map((m) => [
        m.medio_pago,
        m.cantidad,
        `$${m.total}`,
      ]),
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Producto', 'Unidades', 'Total']],
      body: (reporte.productos || []).map((p) => [
        p.nombre,
        p.cantidad,
        `$${p.total}`,
      ]),
    });

    doc.save(`reporte-ventas-${reporte.hasta ?? 'kiosky'}.pdf`);
  };

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Reportes de ventas</h1>
        <p>Consulte las ventas por dia, semana, mes o un rango de fechas propio.</p>
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
              <button className="secundario" onClick={exportar} disabled={!reporte}>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {reporte && reporte.sin_datos && (
        <Mensaje
          tipo="info"
          texto="No existen ventas registradas para el periodo seleccionado."
        />
      )}

      {reporte && !reporte.sin_datos && (
        <>
          <div className="grilla" style={{ marginBottom: 18 }}>
            <Indicador
              etiqueta="Total vendido"
              valor={formatearMoneda(reporte.total_vendido)}
              tono="exito"
            />
            <Indicador etiqueta="Cantidad de ventas" valor={reporte.cantidad_ventas} />
            <Indicador
              etiqueta="Ticket promedio"
              valor={formatearMoneda(reporte.ticket_promedio)}
            />
            <Indicador
              etiqueta="Periodo"
              valor={`${formatearFecha(reporte.desde)} - ${formatearFecha(reporte.hasta)}`}
            />
          </div>

          <div className="grilla">
            <div className="panel">
              <h2>Medios de pago utilizados</h2>
              <div className="tabla-contenedor">
                <table>
                  <thead>
                    <tr>
                      <th>Medio de pago</th>
                      <th className="numero">Ventas</th>
                      <th className="numero">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.medios_pago.map((m) => (
                      <tr key={m.medio_pago}>
                        <td>{m.medio_pago}</td>
                        <td className="numero">{m.cantidad}</td>
                        <td className="numero">{formatearMoneda(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <h2>Productos vendidos</h2>
              <div className="tabla-contenedor">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="numero">Unidades</th>
                      <th className="numero">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.productos.map((p) => (
                      <tr key={p.id_producto}>
                        <td>{p.nombre}</td>
                        <td className="numero">{p.cantidad}</td>
                        <td className="numero">{formatearMoneda(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}