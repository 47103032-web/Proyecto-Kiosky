/**
 * Muestra un mensaje de error, exito o informacion.
 * Si el error trae `detalles`, los lista para que el usuario vea
 * exactamente que debe corregir (ej. items sin stock en una venta).
 */
export default function Mensaje({ tipo = 'info', texto, detalles }) {
  if (!texto) return null;

  const lineas = extraerDetalles(detalles);

  return (
    <div className={`mensaje ${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {texto}
      {lineas.length > 0 && (
        <ul>
          {lineas.map((linea, i) => (
            <li key={i}>{linea}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Aplana la estructura de detalles del backend a una lista de textos. */
function extraerDetalles(detalles) {
  if (!detalles) return [];
  const lineas = [];

  for (const valor of Object.values(detalles)) {
    if (!valor) continue;
    if (typeof valor === 'string') {
      lineas.push(valor);
    } else if (Array.isArray(valor)) {
      for (const item of valor) {
        lineas.push(typeof item === 'string' ? item : item.mensaje ?? JSON.stringify(item));
      }
    } else if (typeof valor === 'object' && valor.mensaje) {
      lineas.push(valor.mensaje);
    }
  }
  return lineas;
}
