/**
 * Gestion de Productos (CU-02, RF-04 a RF-07).
 * Wireframe: buscador, tabla de productos, boton Agregar, botones
 * Editar y Eliminar, stock disponible.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Mensaje from '../components/Mensaje.jsx';
import FormularioProducto from '../components/FormularioProducto.jsx';
import { formatearMoneda, formatearFecha } from '../utils/formato.js';

export default function Productos() {
  const { esPropietario } = useAuth();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const [enEdicion, setEnEdicion] = useState(null); // producto | 'nuevo' | null
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargar = useCallback(async (termino = '') => {
    setCargando(true);
    try {
      const r = await api.get(`/productos?busqueda=${encodeURIComponent(termino)}`);
      setProductos(r.productos);
      setError(null);
    } catch (e) {
      setError({ mensaje: e.message, detalles: e.detalles });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    api.get('/categorias').then((r) => setCategorias(r.categorias)).catch(() => {});
  }, [cargar]);

  // RF-07: la busqueda se dispara con una pequena espera al tipear.
  useEffect(() => {
    const temporizador = setTimeout(() => cargar(busqueda), 300);
    return () => clearTimeout(temporizador);
  }, [busqueda, cargar]);

  async function eliminar(producto) {
    // CU-02 FA-2: el sistema solicita confirmacion.
    const confirmado = window.confirm(
      `Confirma eliminar el producto "${producto.nombre}"?`
    );
    if (!confirmado) return;

    try {
      const r = await api.del(`/productos/${producto.id_producto}`);
      setExito(r.mensaje);
      setError(null);
      cargar(busqueda);
    } catch (e) {
      setError({ mensaje: e.message, detalles: e.detalles });
    }
  }

  function alGuardar(mensaje) {
    setEnEdicion(null);
    setExito(mensaje);
    setError(null);
    cargar(busqueda);
  }

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Productos</h1>
        <p>Alta, modificacion, baja y busqueda del inventario.</p>
      </header>

      <Mensaje tipo="error" texto={error?.mensaje} detalles={error?.detalles} />
      <Mensaje tipo="exito" texto={exito} />

      {enEdicion && (
        <FormularioProducto
          producto={enEdicion === 'nuevo' ? null : enEdicion}
          categorias={categorias}
          onGuardar={alGuardar}
          onCancelar={() => setEnEdicion(null)}
        />
      )}

      <div className="panel">
        <div className="acciones" style={{ marginBottom: 14 }}>
          <input
            type="search"
            placeholder="Buscar por nombre o codigo de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ maxWidth: 340 }}
          />
          {esPropietario && !enEdicion && (
            <button onClick={() => setEnEdicion('nuevo')}>Agregar producto</button>
          )}
        </div>

        {cargando ? (
          <p className="vacio">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="vacio">
            {busqueda
              ? `No se encontraron productos que coincidan con "${busqueda}".`
              : 'Todavia no hay productos registrados.'}
          </p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Producto</th>
                  <th>Categoria</th>
                  <th className="numero">Precio</th>
                  <th className="numero">Stock</th>
                  <th className="numero">Minimo</th>
                  <th>Vencimiento</th>
                  {esPropietario && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id_producto}>
                    <td>{p.codigo_barra ?? <span className="etiqueta neutra">sin codigo</span>}</td>
                    <td>{p.nombre}</td>
                    <td>{p.categoria ?? '-'}</td>
                    <td className="numero">{formatearMoneda(p.precio)}</td>
                    <td className="numero">
                      <span className={`etiqueta ${claseStock(p)}`}>{p.stock_actual}</span>
                    </td>
                    <td className="numero">{p.stock_minimo}</td>
                    <td>
                      {formatearFecha(p.fecha_vencimiento)}
                      {p.vencido && <span className="etiqueta critica"> vencido</span>}
                    </td>
                    {esPropietario && (
                      <td>
                        <div className="acciones">
                          <button className="secundario chico" onClick={() => setEnEdicion(p)}>
                            Editar
                          </button>
                          <button className="peligro chico" onClick={() => eliminar(p)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/** RF-13: resalta visualmente el stock agotado o por debajo del minimo. */
function claseStock(producto) {
  if (producto.stock_actual === 0) return 'critica';
  if (producto.bajo_stock) return 'aviso';
  return 'ok';
}
