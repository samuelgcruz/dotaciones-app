// lib/formato.js
// Formatos compartidos: precios, tipos de prenda y orden natural de tallas.

// Precios en pesos colombianos, sin decimales: $85.000
const formateador = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatoPrecio(valor) {
  return `$${formateador.format(Number(valor) || 0)}`;
}

export function formatoNumero(valor) {
  return formateador.format(Number(valor) || 0);
}

// Nombre legible de un tipo de prenda (el enum de la BD viene en minúsculas y sin tildes)
const NOMBRES_TIPO = { pantalon: 'Pantalón', camiseta: 'Camiseta', camisa: 'Camisa', chaqueta: 'Chaqueta' };

export function etiquetaTipo(tipo) {
  const t = String(tipo ?? '').trim().toLowerCase();
  if (!t) return 'Otras prendas';
  if (NOMBRES_TIPO[t]) return NOMBRES_TIPO[t];
  const limpio = t.replace(/_/g, ' ');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

// Orden natural de tallas: XS, S, M, L, XL... y luego las numéricas (28, 30, 32...)
const ORDEN_LETRAS = { XXS: 0, XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, '2XL': 6, XXXL: 7, '3XL': 7, '4XL': 8 };

function llaveOrden(nombre) {
  const n = String(nombre).trim().toUpperCase();
  if (ORDEN_LETRAS[n] !== undefined) return [0, ORDEN_LETRAS[n], n];
  const numero = Number(n.replace(',', '.'));
  if (Number.isFinite(numero)) return [1, numero, n];
  return [2, 0, n];
}

export function compararNombresTalla(a, b) {
  const [ga, va, ta] = llaveOrden(a);
  const [gb, vb, tb] = llaveOrden(b);
  return ga - gb || va - vb || ta.localeCompare(tb);
}

// ---------- Género de las prendas ----------
// En la BD: productos.genero = 'hombre' | 'mujer' | 'unisex' (por defecto 'unisex').
export const ETIQUETA_GENERO = { mujer: 'Mujer', hombre: 'Hombre', unisex: 'Unisex' };

export function normalizarGenero(valor) {
  const g = String(valor ?? '').trim().toLowerCase();
  return g === 'mujer' || g === 'hombre' ? g : 'unisex';
}
