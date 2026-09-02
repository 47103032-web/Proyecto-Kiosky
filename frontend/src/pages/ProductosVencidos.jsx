/**
 * Productos vencidos o danados (CU-03, RF-11, RF-12).
 * Permite seleccionar el producto, indicar motivo y cantidad; el
 * sistema descuenta el stock y registra la operacion.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Mensaje from '../components/Mensaje.jsx';
import { formatearFecha, diasHasta } from '../utils/formato.js';

const MOTIVOS = [
  { valor: 'vencido', texto: 'Vencido' },
  { valor: 'danado', texto: 'Danado' },
  { valor: 'otro', texto: 'Otro motivo' },
];

export default function ProductosVencidos() {
  const [productos, setProductos] = useState([]);
  const [alertas, setAlertas] = useState({ vencidos: [], proximos_a_vencer: [] });
  const [bajas, setBajas] = useState([]);

  const [idProducto, setIdProducto] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('vencido');

  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [listado, alertasApi, historial] = await Promise.all([
        api.get('/productos'),
        api.get('/stock/alertas'),
        api.get('/bajas'),
      ]);
      setProductos(listado.productos);
      setAlertas(alertasApi);
      setBajas(historial.bajas);
    } catch (e) {
      setError({ mensaje: e.message });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const seleccionado = productos.find((p) => String(p.id_producto) === idProducto);

  async function registrar(evento) {
    evento.preventDefault();
    setError(null);
    setExito(null);

    if (!idProducto) {
      setError({ mensaje: 'Debe seleccionar un producto.' });
      return;
    }
    const unidades = Number(cantidad);
    if (!Number.isInteger(unidades) || unidades <= 0) {
      setError({ mensaje: 'La cantidad debe ser un numero entero mayor a cero.' });
      return;
    }
    // CU-03 FA-1: la cantidad no puede superar el stock disponible.
    if (seleccionado && unidades > seleccionado.stock_actual) {
      setError({
        mensaje: `La cantidad (${unidades}) supera el stock disponible (${seleccionado.stock_actual}).`,
      });
      return;
    }

    setEnviando(true);
    try {
      const r = await api.post('/bajas', {
        id_producto: Number(idProducto),
        cantidad: unidades,
        motivo,
      });
      setExito(r.mensaje);
      setCantidad('1');
      setIdProducto('');
      await cargar();
    } catch (e) {
      setError({ mensaje: e.message, detalles: e.detalles });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Productos vencidos o danados</h1>
        <p>Registre las unidades que ya no pueden comercializarse para mantener el stock real.</p>
      </header>

      <Mensaje tipo="error" texto={error?.mensaje} detalles={error?.detalles} />
      <Mensaje tipo="exito" texto={exito} />

      <form className="panel" onSubmit={registrar}>
        <h2>Registrar baja</h2>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="producto">Producto</label>
            <select id="producto" value={idProducto} onChange={(e) => setIdProducto(e.target.value)}>
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre} (stock: {p.stock_actual})
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="motivo">Motivo</label>
            <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {MOTIVOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.texto}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="cantidad">Cantidad</label>
            <input
              id="cantidad"
              type="number"
              min="1"
              max={seleccionado?.stock_actual ?? undefined}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
            {seleccionado && (
              <div className="error-campo" style={{ color: 'var(--color-texto-suave)' }}>
                Stock disponible: {seleccionado.stock_actual}
              </div>
            )}
          </div>

          <div className="campo" style={{ alignSelf: 'end' }}>
            <button type="submit" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Registrar baja'}
            </button>
          </div>
        </div>
      </form>

      <div className="grilla">
        <div className="panel">
          <h2>Vencidos en inventario</h2>
          <TablaSimple
            filas={alertas.vencidos}
            vacio="No hay productos vencidos."
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
          <h2>Proximos a vencer</h2>
          <TablaSimple
            filas={alertas.proximos_a_vencer}
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
      </div>

      <div className="panel">
        <h2>Historial de bajas</h2>
        <TablaSimple
          filas={bajas}
          vacio="Todavia no se registraron bajas."
          columnas={['Fecha', 'Producto', 'Motivo', 'Cantidad']}
          render={(b) => (
            <tr key={b.id_baja}>
              <td>{formatearFecha(b.fecha_hora, true)}</td>
              <td>{b.nombre_producto}</td>
              <td>
                <span className="etiqueta neutra">{b.motivo}</span>
              </td>
              <td className="numero">{b.cantidad}</td>
            </tr>
          )}
        />
      </div>
    </>
  );
}

/** Tabla reutilizable con estado vacio. */
function TablaSimple({ filas, columnas, render, vacio }) {
  if (!filas || filas.length === 0) return <p className="vacio">{vacio}</p>;
  return (
    <div className="tabla-contenedor">
      <table>
        <thead>
          <tr>
            {columnas.map((c, i) => (
              <th key={c} className={i === columnas.length - 1 ? 'numero' : ''}>
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
