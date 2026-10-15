// lib/formato.js
// Formato de precios en pesos colombianos, sin decimales: $85.000
const formateador = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatoPrecio(valor) {
  return `$${formateador.format(Number(valor) || 0)}`;
}
