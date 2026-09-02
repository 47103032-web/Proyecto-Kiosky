/** Tarjeta de indicador usada en el dashboard. */
export default function Indicador({ etiqueta, valor, tono = '' }) {
  return (
    <div className={`indicador ${tono}`}>
      <div className="etiqueta">{etiqueta}</div>
      <div className="valor">{valor}</div>
    </div>
  );
}
