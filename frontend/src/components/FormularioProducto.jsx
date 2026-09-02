/**
 * Formulario de alta y modificacion de productos (CU-02).
 * Valida en el cliente y muestra ademas los errores por campo que
 * devuelve el backend, para que ambos niveles queden cubiertos.
 */
import { useState } from 'react';
import { api } from '../api/client.js';
import Mensaje from './Mensaje.jsx';

const VACIO = {
  codigo_barra: '',
  nombre: '',
  descripcion: '',
  precio: '',
  stock_actual: '0',
  stock_minimo: '0',
  fecha_vencimiento: '',
  id_categoria: '',
};

export default function FormularioProducto({ producto, categorias, onGuardar, onCancelar }) {
  const esEdicion = Boolean(producto);

  const [datos, setDatos] = useState(
    esEdicion
      ? {
          codigo_barra: producto.codigo_barra ?? '',
          nombre: producto.nombre ?? '',
          descripcion: producto.descripcion ?? '',
          precio: String(producto.precio ?? ''),
          stock_actual: String(producto.stock_actual ?? 0),
          stock_minimo: String(producto.stock_minimo ?? 0),
          fecha_vencimiento: producto.fecha_vencimiento
            ? String(producto.fecha_vencimiento).slice(0, 10)
            : '',
          id_categoria: producto.id_categoria ? String(producto.id_categoria) : '',
        }
      : VACIO
  );

  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (evento) =>
    setDatos((previo) => ({ ...previo, [campo]: evento.target.value }));

  /** Validaciones del lado del cliente antes de llamar a la API. */
  function validar() {
    const nuevos = {};
    if (!datos.nombre.trim() || datos.nombre.trim().length < 2) {
      nuevos.nombre = 'El nombre es obligatorio (minimo 2 caracteres).';
    }
    const precio = Number(datos.precio);
    if (datos.precio === '' || !Number.isFinite(precio) || precio < 0) {
      nuevos.precio = 'El precio debe ser un numero mayor o igual a cero.';
    }
    const stock = Number(datos.stock_actual);
    if (!Number.isInteger(stock) || stock < 0) {
      nuevos.stock_actual = 'El stock debe ser un entero mayor o igual a cero.';
    }
    const minimo = Number(datos.stock_minimo);
    if (!Number.isInteger(minimo) || minimo < 0) {
      nuevos.stock_minimo = 'El stock minimo debe ser un entero mayor o igual a cero.';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    if (!validar()) return;

    const cuerpo = {
      codigo_barra: datos.codigo_barra.trim() || null,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim() || null,
      precio: Number(datos.precio),
      stock_actual: Number(datos.stock_actual),
      stock_minimo: Number(datos.stock_minimo),
      fecha_vencimiento: datos.fecha_vencimiento || null,
      id_categoria: datos.id_categoria ? Number(datos.id_categoria) : null,
    };

    setEnviando(true);
    try {
      const r = esEdicion
        ? await api.put(`/productos/${producto.id_producto}`, cuerpo)
        : await api.post('/productos', cuerpo);
      onGuardar(r.mensaje);
    } catch (e) {
      setError({ mensaje: e.message, detalles: e.detalles });
      if (e.detalles && typeof e.detalles === 'object') setErrores(e.detalles);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="panel" onSubmit={enviar}>
      <h2>{esEdicion ? `Editar: ${producto.nombre}` : 'Nuevo producto'}</h2>

      <Mensaje tipo="error" texto={error?.mensaje} />

      <div className="fila-campos">
        <Campo etiqueta="Nombre" error={errores.nombre}>
          <input
            value={datos.nombre}
            onChange={cambiar('nombre')}
            className={errores.nombre ? 'invalido' : ''}
          />
        </Campo>

        <Campo etiqueta="Codigo de barras" error={errores.codigo_barra}>
          <input
            value={datos.codigo_barra}
            onChange={cambiar('codigo_barra')}
            placeholder="Opcional"
            className={errores.codigo_barra ? 'invalido' : ''}
          />
        </Campo>

        <Campo etiqueta="Categoria">
          <select value={datos.id_categoria} onChange={cambiar('id_categoria')}>
            <option value="">Sin categoria</option>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="fila-campos">
        <Campo etiqueta="Precio" error={errores.precio}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={datos.precio}
            onChange={cambiar('precio')}
            className={errores.precio ? 'invalido' : ''}
          />
        </Campo>

        <Campo etiqueta="Stock actual" error={errores.stock_actual}>
          <input
            type="number"
            min="0"
            value={datos.stock_actual}
            onChange={cambiar('stock_actual')}
            className={errores.stock_actual ? 'invalido' : ''}
          />
        </Campo>

        <Campo etiqueta="Stock minimo" error={errores.stock_minimo}>
          <input
            type="number"
            min="0"
            value={datos.stock_minimo}
            onChange={cambiar('stock_minimo')}
            className={errores.stock_minimo ? 'invalido' : ''}
          />
        </Campo>

        <Campo etiqueta="Fecha de vencimiento" error={errores.fecha_vencimiento}>
          <input
            type="date"
            value={datos.fecha_vencimiento}
            onChange={cambiar('fecha_vencimiento')}
            className={errores.fecha_vencimiento ? 'invalido' : ''}
          />
        </Campo>
      </div>

      <Campo etiqueta="Descripcion">
        <input value={datos.descripcion} onChange={cambiar('descripcion')} placeholder="Opcional" />
      </Campo>

      <div className="acciones">
        <button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar producto'}
        </button>
        <button type="button" className="secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Campo({ etiqueta, error, children }) {
  return (
    <div className="campo">
      <label>{etiqueta}</label>
      {children}
      {error && <div className="error-campo">{error}</div>}
    </div>
  );
}
