/**
 * Registrar Venta (CU-01, RF-02, RF-03, RF-08).
 * Wireframe: buscador por nombre, buscador por codigo de barras, lista
 * de productos, cantidad, total, medio de pago y Confirmar Venta.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import Mensaje from '../components/Mensaje.jsx';
import { formatearMoneda } from '../utils/formato.js';

export default function RegistrarVenta() {
  const [productos, setProductos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [codigoBarra, setCodigoBarra] = useState('');

  const [carrito, setCarrito] = useState([]);
  const [idMedioPago, setIdMedioPago] = useState('');

  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const campoCodigo = useRef(null);

  useEffect(() => {
    api.get('/medios-pago').then((r) => {
      setMediosPago(r.medios_pago);
      if (r.medios_pago.length > 0) setIdMedioPago(String(r.medios_pago[0].id_medio_pago));
    });
    campoCodigo.current?.focus();
  }, []);

  // CU-01 pasos 3 y 4: busqueda de productos por nombre.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      api
        .get(`/productos?busqueda=${encodeURIComponent(busqueda)}`)
        .then((r) => setProductos(r.productos))
        .catch((e) => setError({ mensaje: e.message }));
    }, 250);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  // CU-01 paso 6: el total se calcula automaticamente.
  const total = useMemo(
    () => carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    [carrito]
  );

  function agregar(producto) {
    setExito(null);
    setError(null);

    if (producto.stock_actual === 0) {
      setError({ mensaje: `"${producto.nombre}" no tiene stock disponible.` });
      return;
    }

    setCarrito((previo) => {
      const existente = previo.find((i) => i.id_producto === producto.id_producto);
      if (existente) {
        // No se permite superar el stock disponible (CU-01 FA-1).
        if (existente.cantidad >= producto.stock_actual) {
          setError({
            mensaje: `Solo hay ${producto.stock_actual} unidad(es) de "${producto.nombre}".`,
          });
          return previo;
        }
        return previo.map((i) =>
          i.id_producto === producto.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...previo,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stock_actual,
          cantidad: 1,
        },
      ];
    });
  }

  /** CU-01 paso 3: busqueda por codigo de barras. */
  async function buscarPorCodigo(evento) {
    evento?.preventDefault?.();
    const codigo = codigoBarra.trim();
    if (!codigo) return;

    setError(null);
    try {
      const r = await api.get(`/productos/codigo/${encodeURIComponent(codigo)}`);
      agregar(r.producto);
      setCodigoBarra('');
    } catch (e) {
      // CU-01 FA-2: producto inexistente.
      setError({ mensaje: e.message });
    } finally {
      campoCodigo.current?.focus();
    }
  }

  function cambiarCantidad(idProducto, cantidad) {
    const valor = Number(cantidad);
    setCarrito((previo) =>
      previo.map((i) => {
        if (i.id_producto !== idProducto) return i;
        if (!Number.isInteger(valor) || valor < 1) return { ...i, cantidad: 1 };
        if (valor > i.stock) {
          setError({ mensaje: `Solo hay ${i.stock} unidad(es) de "${i.nombre}".` });
          return { ...i, cantidad: i.stock };
        }
        return { ...i, cantidad: valor };
      })
    );
  }

  const quitar = (idProducto) =>
    setCarrito((previo) => previo.filter((i) => i.id_producto !== idProducto));

  async function confirmar() {
    setError(null);
    setExito(null);

    if (carrito.length === 0) {
      setError({ mensaje: 'Debe agregar al menos un producto a la venta.' });
      return;
    }
    if (!idMedioPago) {
      setError({ mensaje: 'Debe seleccionar un medio de pago.' });
      return;
    }

    setEnviando(true);
    try {
      const r = await api.post('/ventas', {
        id_medio_pago: Number(idMedioPago),
        items: carrito.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
      });
      setExito(`${r.mensaje} Total: ${formatearMoneda(r.venta.total)}`);
      setCarrito([]);
      // Se refresca el listado para reflejar el stock actualizado (RF-03).
      const listado = await api.get(`/productos?busqueda=${encodeURIComponent(busqueda)}`);
      setProductos(listado.productos);
      campoCodigo.current?.focus();
    } catch (e) {
      setError({ mensaje: e.message, detalles: e.detalles });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="encabezado-pagina">
        <h1>Registrar venta</h1>
        <p>Busque productos por nombre o codigo de barras y confirme la operacion.</p>
      </header>

      <Mensaje tipo="error" texto={error?.mensaje} detalles={error?.detalles} />
      <Mensaje tipo="exito" texto={exito} />

      <div className="grilla" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)' }}>
        <div className="panel">
          <h2>Buscar productos</h2>

          <form onSubmit={buscarPorCodigo} className="campo">
            <label htmlFor="codigo">Codigo de barras</label>
            <div className="acciones">
              <input
                id="codigo"
                ref={campoCodigo}
                value={codigoBarra}
                onChange={(e) => setCodigoBarra(e.target.value)}
                // Los lectores de codigo de barras emiten Enter al final de
                // la lectura. Se maneja de forma explicita para no depender
                // del envio implicito del formulario.
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarPorCodigo();
                  }
                }}
                placeholder="Escanear o escribir y presionar Enter"
                style={{ flex: 1, minWidth: 180 }}
              />
              <button type="submit" className="secundario">
                Agregar
              </button>
            </div>
          </form>

          <div className="campo">
            <label htmlFor="nombre">Buscar por nombre</label>
            <input
              id="nombre"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre del producto..."
            />
          </div>

          <div className="tabla-contenedor" style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="numero">Precio</th>
                  <th className="numero">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="vacio">
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  productos.map((p) => (
                    <tr key={p.id_producto}>
                      <td>{p.nombre}</td>
                      <td className="numero">{formatearMoneda(p.precio)}</td>
                      <td className="numero">
                        <span className={`etiqueta ${p.stock_actual === 0 ? 'critica' : 'ok'}`}>
                          {p.stock_actual}
                        </span>
                      </td>
                      <td>
                        <button
                          className="secundario chico"
                          onClick={() => agregar(p)}
                          disabled={p.stock_actual === 0}
                        >
                          Agregar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Detalle de la venta</h2>

          {carrito.length === 0 ? (
            <p className="vacio">Todavia no agrego productos.</p>
          ) : (
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="numero">Cantidad</th>
                    <th className="numero">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((i) => (
                    <tr key={i.id_producto}>
                      <td>
                        {i.nombre}
                        <br />
                        <small style={{ color: 'var(--color-texto-suave)' }}>
                          {formatearMoneda(i.precio)} c/u
                        </small>
                      </td>
                      <td className="numero">
                        <input
                          type="number"
                          min="1"
                          max={i.stock}
                          value={i.cantidad}
                          onChange={(e) => cambiarCantidad(i.id_producto, e.target.value)}
                          style={{ width: 78, textAlign: 'right' }}
                        />
                      </td>
                      <td className="numero">{formatearMoneda(i.precio * i.cantidad)}</td>
                      <td>
                        <button className="peligro chico" onClick={() => quitar(i.id_producto)}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="campo" style={{ marginTop: 14 }}>
            <label htmlFor="medio">Medio de pago</label>
            <select
              id="medio"
              value={idMedioPago}
              onChange={(e) => setIdMedioPago(e.target.value)}
            >
              {mediosPago.map((m) => (
                <option key={m.id_medio_pago} value={m.id_medio_pago}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: '1px solid var(--color-borde)',
              marginTop: 8,
            }}
          >
            <strong>Total</strong>
            <strong style={{ fontSize: '1.5rem' }}>{formatearMoneda(total)}</strong>
          </div>

          <div className="acciones">
            <button onClick={confirmar} disabled={enviando || carrito.length === 0}>
              {enviando ? 'Registrando...' : 'Confirmar venta'}
            </button>
            <button
              className="secundario"
              onClick={() => setCarrito([])}
              disabled={carrito.length === 0}
            >
              Vaciar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
