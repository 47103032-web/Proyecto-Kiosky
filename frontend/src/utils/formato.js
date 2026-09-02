/** Utilidades de presentacion compartidas por las pantallas. */

const monedaAR = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export const formatearMoneda = (valor) => monedaAR.format(Number(valor ?? 0));

/** Convierte 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS' a formato local. */
export function formatearFecha(valor, conHora = false) {
  if (!valor) return '-';
  const [fecha, hora] = String(valor).split(' ');
  const [a, m, d] = fecha.split('-');
  const base = `${d}/${m}/${a}`;
  return conHora && hora ? `${base} ${hora.slice(0, 5)}` : base;
}

/** Fecha de hoy en formato AAAA-MM-DD, para los filtros por rango. */
export function hoyISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Dias que faltan para una fecha (negativo si ya paso). */
export function diasHasta(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(`${String(fechaISO).slice(0, 10)}T00:00:00`);
  return Math.round((objetivo - hoy) / 86400000);
}
