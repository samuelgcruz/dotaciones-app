// lib/catalogo.js
// Agrupa las prendas en "familias" y aplica el filtro de género. Lógica pura.
//
// Una familia es una prenda con una o varias versiones:
//   - Si dos productos comparten `grupo` (ej. 'bata-medica') forman UNA familia con
//     su versión de mujer y su versión de hombre; cada versión conserva su propio stock.
//   - Un producto sin `grupo` es una familia de una sola versión.
import { normalizarGenero } from './formato';

export const VISTAS = [
  { valor: 'mujer', etiqueta: 'Mujer' },
  { valor: 'hombre', etiqueta: 'Hombre' },
  { valor: 'ambos', etiqueta: 'Ver ambos' },
];

const ORDEN_GENERO = { mujer: 0, hombre: 1, unisex: 2 };

export function armarFamilias(productos) {
  const porClave = new Map();
  for (const p of productos) {
    const grupo = String(p.grupo ?? '').trim();
    const clave = grupo ? `g:${grupo}` : `p:${p.id}`;
    let familia = porClave.get(clave);
    if (!familia) {
      familia = { clave, tipo: p.tipo_prenda, variantes: [] };
      porClave.set(clave, familia);
    }
    familia.variantes.push({ ...p, genero: normalizarGenero(p.genero) });
  }
  const familias = [...porClave.values()];
  for (const f of familias) {
    f.variantes.sort(
      (a, b) => ORDEN_GENERO[a.genero] - ORDEN_GENERO[b.genero] || a.nombre.localeCompare(b.nombre, 'es')
    );
  }
  return familias;
}

// Las prendas unisex siempre se muestran: le sirven a cualquiera.
export function filtrarFamilias(familias, vista) {
  if (vista === 'ambos') return familias;
  return familias
    .map((f) => ({ ...f, variantes: f.variantes.filter((v) => v.genero === vista || v.genero === 'unisex') }))
    .filter((f) => f.variantes.length > 0);
}

// ¿Hay alguna prenda de hombre o de mujer en la zona? Si no, el filtro no tiene qué separar.
export function hayPrendasPorGenero(productos) {
  return productos.some((p) => normalizarGenero(p.genero) !== 'unisex');
}

// Palabras del género para que la búsqueda entienda "dama" o "caballero".
export const PALABRAS_GENERO = { mujer: 'mujer dama', hombre: 'hombre caballero', unisex: 'unisex' };

// Texto en el que se busca cada prenda o accesorio.
export function textoBuscable({ nombre, descripcion, tipo, genero }) {
  return [nombre, descripcion, tipo, PALABRAS_GENERO[normalizarGenero(genero)] ?? ''].filter(Boolean).join(' ');
}

// Índice liviano de todo el catálogo (para el buscador de la página de inicio y para
// comprobar si algo que se sugiere ya existe). Parte de las zonas de construirZonas().
export function construirIndiceBusqueda(zonas) {
  const indice = [];
  for (const z of zonas) {
    for (const p of z.prendas) {
      indice.push({
        clave: `p:${p.id}`,
        clase: 'prenda',
        nombre: p.nombre,
        genero: p.genero,
        precio: p.precio,
        zonaNombre: z.nombre,
        zonaSlug: z.slug,
        texto: textoBuscable({ nombre: p.nombre, descripcion: p.descripcion, tipo: p.tipo, genero: p.genero }),
      });
    }
    for (const a of z.accesorios) {
      indice.push({
        clave: `a:${a.id}`,
        clase: 'accesorio',
        nombre: a.nombre,
        genero: null,
        precio: a.precio,
        zonaNombre: z.nombre,
        zonaSlug: z.slug,
        texto: textoBuscable({ nombre: a.nombre, descripcion: a.descripcion, tipo: 'accesorio' }),
      });
    }
  }
  return indice;
}
