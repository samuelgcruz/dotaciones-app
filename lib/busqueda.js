// lib/busqueda.js
// Búsqueda "inteligente" sin IA ni servicios externos: funciona igual en local y en Vercel.
// Se apoya en reglas simples sobre el catálogo:
//   - ignora mayúsculas, tildes y signos ("PANTALON" encuentra "Pantalón").
//   - entiende plurales ("guantes" ↔ "guante", "pantalones" ↔ "pantalón").
//   - tolera errores de tecleo ("pantalom", "gorrro").
//   - reconoce sinónimos ("cofia" ↔ "gorro", "mandil" ↔ "delantal", "dama" ↔ "mujer").
//   - propone "¿Quisiste decir…?" cuando no hay resultados.
//   - sugiere complementos del pedido de una zona (lo que suele faltar).

const SIN_SIGNIFICADO = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'con', 'sin', 'y', 'o', 'en', 'por']);

// Cada fila es un grupo de palabras que significan lo mismo en dotación.
const SINONIMOS = [
  ['bata', 'filipina', 'casaca', 'chaqueta', 'blusa', 'camisa', 'camisola', 'guardapolvo'],
  ['pantalon', 'jean', 'cargo', 'bermuda'],
  ['gorro', 'cofia', 'gorra', 'cachucha', 'sombrero', 'boina', 'turbante'],
  ['zapato', 'calzado', 'bota', 'botin', 'tenis', 'zueco', 'crocs'],
  ['guante', 'mitones', 'manopla'],
  ['tapabocas', 'mascarilla', 'cubrebocas', 'barbijo', 'nasobuco', 'respirador'],
  ['delantal', 'mandil', 'peto'],
  ['overol', 'enterizo', 'mono', 'braga'],
  ['casco', 'capacete'],
  ['chaleco', 'reflectivo', 'reflectiva'],
  ['gafa', 'lente', 'antiparra', 'monogafa', 'visor'],
  ['camiseta', 'polo', 'playera', 'franela', 'remera', 'buso'],
  ['impermeable', 'poncho', 'capa'],
  ['mujer', 'dama', 'femenino', 'femenina', 'senora'],
  ['hombre', 'caballero', 'masculino', 'varon'],
];

export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Quita el plural: guantes → guante, pantalones → pantalon, cascos → casco.
function raiz(palabra) {
  const p = palabra;
  if (p.length > 5 && p.endsWith('ones')) return p.slice(0, -2);
  if (p.length > 4 && p.endsWith('es')) return p.slice(0, -1);
  if (p.length > 3 && p.endsWith('s')) return p.slice(0, -1);
  return p;
}

export function tokens(texto) {
  return normalizar(texto)
    .split(' ')
    .filter((t) => t && !SIN_SIGNIFICADO.has(t))
    .map(raiz);
}

// raíz → todas las raíces del mismo grupo de sinónimos
const MAPA_SINONIMOS = new Map();
for (const grupo of SINONIMOS) {
  const raices = grupo.map((g) => raiz(g));
  for (const r of raices) MAPA_SINONIMOS.set(r, raices);
}

// Distancia de edición con corte: si supera `max` devuelve max + 1.
function distancia(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    let minimo = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(previa[j] + 1, actual[j - 1] + 1, previa[j - 1] + costo);
      if (actual[j] < minimo) minimo = actual[j];
    }
    if (minimo > max) return max + 1;
    previa = actual;
  }
  return previa[b.length];
}

// Cuántos errores de tecleo se toleran según el largo de la palabra.
// Las palabras cortas no se corrigen: "bata" y "bota" son cosas distintas.
const tolerancia = (largo) => (largo < 5 ? 0 : largo < 9 ? 1 : 2);

// Puntaje de una palabra buscada contra una palabra del artículo (0 = no coincide).
function puntajePalabra(buscada, delArticulo, conErrores = true) {
  if (buscada === delArticulo) return 3;
  if (buscada.length >= 3 && delArticulo.startsWith(buscada)) return 2;
  if (!conErrores) return 0;
  const t = tolerancia(buscada.length);
  if (t > 0 && distancia(buscada, delArticulo, t) <= t) return 1;
  return 0;
}

// Devuelve 0 si el artículo no cubre TODAS las palabras buscadas; si las cubre, un puntaje.
function puntuar(consultaTokens, textoArticulo) {
  const delArticulo = tokens(textoArticulo);
  if (delArticulo.length === 0) return 0;
  let total = 0;
  for (const buscada of consultaTokens) {
    // Lo que escribió la persona admite errores de tecleo; los sinónimos solo coinciden exactos o por prefijo.
    const variantes = [[buscada, 1, true], ...(MAPA_SINONIMOS.get(buscada) ?? []).filter((v) => v !== buscada).map((v) => [v, 0.5, false])];
    let mejor = 0;
    for (const [variante, peso, conErrores] of variantes) {
      for (const palabra of delArticulo) {
        const s = puntajePalabra(variante, palabra, conErrores) * peso;
        if (s > mejor) mejor = s;
      }
    }
    if (mejor === 0) return 0;
    total += mejor;
  }
  return total;
}

/**
 * Filtra y ordena `items` por la consulta. `texto(item)` devuelve lo que se busca de cada uno.
 * Con la consulta vacía devuelve todos en su orden original.
 */
export function buscar(items, consulta, texto) {
  const q = tokens(consulta);
  if (q.length === 0) return items.map((item) => ({ item, puntaje: 0 }));
  return items
    .map((item) => ({ item, puntaje: puntuar(q, texto(item)) }))
    .filter((r) => r.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje);
}

export function coincide(consulta, texto) {
  const q = tokens(consulta);
  return q.length === 0 || puntuar(q, texto) > 0;
}

// Palabras que "conoce" el buscador: las del catálogo más los sinónimos.
// Guarda también cómo se escribe cada una de forma natural (con su plural) para mostrarla
// en "¿Quisiste decir…?": el buscador trabaja con raíces ("tapaboca"), pero se lee "tapabocas".
export function construirVocabulario(textos) {
  const vocab = new Set();
  const visible = new Map();
  for (const t of textos) {
    for (const palabra of normalizar(t).split(' ')) {
      const r = raiz(palabra);
      if (palabra && r.length >= 3 && !SIN_SIGNIFICADO.has(palabra)) {
        vocab.add(r);
        if (!visible.has(r)) visible.set(r, palabra);
      }
    }
  }
  for (const grupo of SINONIMOS) {
    for (const palabra of grupo) {
      const r = raiz(palabra);
      vocab.add(r);
      if (!visible.has(r)) visible.set(r, palabra);
    }
  }
  const lista = [...vocab];
  lista.visible = visible;
  return lista;
}

/**
 * "¿Quisiste decir…?": corrige las palabras que no existen en el vocabulario por la más
 * parecida. Devuelve el texto corregido o null si no hay nada razonable que proponer.
 */
export function sugerirCorreccion(consulta, vocabulario) {
  const palabras = normalizar(consulta).split(' ').filter(Boolean);
  let cambio = false;
  const corregidas = palabras.map((original) => {
    const r = raiz(original);
    if (SIN_SIGNIFICADO.has(original) || vocabulario.includes(r) || r.length < 3) return original;
    const max = Math.max(1, Math.min(2, Math.floor(r.length / 3)));
    let mejor = null;
    let mejorDist = max + 1;
    for (const v of vocabulario) {
      const d = distancia(r, v, max);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = v;
      }
    }
    if (mejor && mejorDist <= max) {
      cambio = true;
      return vocabulario.visible?.get(mejor) ?? mejor;
    }
    return original;
  });
  return cambio ? corregidas.join(' ') : null;
}

// ---------------------------------------------------------------------------
// Complementos: qué suele faltarle a un pedido de una zona. Reglas, no IA.
// ---------------------------------------------------------------------------

/**
 * @param {Object} p
 * @param {Array}  p.familias    - familias de prendas de la zona (lib/catalogo.js)
 * @param {Array}  p.accesorios  - accesorios de la zona
 * @param {Array}  p.lineas      - líneas del carrito
 * @param {string} p.zonaId
 * @returns {Array} hasta 5 sugerencias { clave, tipo, titulo, motivo, ancla, accesorioId? }
 */
export function sugerirComplementos({ familias, accesorios, lineas, zonaId }) {
  const deLaZona = lineas.filter((l) => l.categoriaId === zonaId);
  if (deLaZona.length === 0) return [];

  const idsPedidos = new Set(deLaZona.map((l) => l.id));
  const sugerencias = [];

  // 1) La otra versión de la misma prenda (pediste mujer, ¿y hombre?).
  for (const f of familias) {
    if (f.variantes.length < 2) continue;
    const pedidas = f.variantes.filter((v) => idsPedidos.has(v.id));
    const faltan = f.variantes.filter((v) => !idsPedidos.has(v.id) && v.genero !== 'unisex');
    if (pedidas.length > 0 && faltan.length > 0) {
      sugerencias.push({
        clave: `v:${f.clave}`,
        tipo: 'familia',
        titulo: `${f.variantes[0].nombre} (${faltan.map((v) => (v.genero === 'mujer' ? 'mujer' : 'hombre')).join(' y ')})`,
        motivo: 'Pediste la otra versión de esta prenda',
        ancla: f.clave,
      });
    }
  }

  // 2) Tipos de prenda que la zona ofrece y el pedido aún no tiene (camisas sin pantalón...).
  const tiposPedidos = new Set();
  for (const f of familias) if (f.variantes.some((v) => idsPedidos.has(v.id))) tiposPedidos.add(f.tipo);
  if (tiposPedidos.size > 0) {
    const vistos = new Set();
    for (const f of familias) {
      if (tiposPedidos.has(f.tipo) || vistos.has(f.tipo)) continue;
      vistos.add(f.tipo);
      sugerencias.push({
        clave: `t:${f.clave}`,
        tipo: 'familia',
        titulo: f.variantes[0].nombre,
        motivo: 'Completa el uniforme: aún no llevas este tipo de prenda',
        ancla: f.clave,
      });
    }
  }

  // 3) Accesorios de la zona que todavía no están en el pedido (primero los que no llevan talla).
  const sinPedir = accesorios.filter((a) => !idsPedidos.has(a.id));
  sinPedir.sort((a, b) => Number(Boolean(a.requiere_talla)) - Number(Boolean(b.requiere_talla)));
  for (const a of sinPedir.slice(0, 3)) {
    sugerencias.push({
      clave: `a:${a.id}`,
      tipo: 'accesorio',
      titulo: a.nombre,
      motivo: 'Accesorio de esta zona que aún no llevas',
      ancla: `acc-${a.id}`,
      accesorio: a,
    });
  }

  return sugerencias.slice(0, 5);
}
