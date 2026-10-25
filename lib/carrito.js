// lib/carrito.js
//
// Carrito de dotaciones, compartido por TODAS las zonas del sitio.
//
// - Vive en el navegador (localStorage), así que sobrevive a recargas y a
//   cambiar de zona. NO toca la base de datos: la BD solo se usa al enviar el
//   pedido (/api/pedidos), que revalida precios y stock en el servidor.
// - Se implementa como un pequeño store externo + useSyncExternalStore, por lo
//   que no necesita Provider: cualquier componente de cliente puede llamar a
//   useCarrito().
//
// Cada "línea" del carrito es una combinación única:
//   prenda + talla  → una línea con su cantidad
//   accesorio       → una línea con su cantidad
import { useMemo, useSyncExternalStore } from 'react';

const CLAVE_ALMACEN = 'dotaciones-carrito-v1';

export const MAX_POR_LINEA = 99; // el backend rechaza cantidades > 99
export const MAX_LINEAS_POR_ZONA = 50; // el backend acepta hasta 50 ítems por pedido

const VACIO = Object.freeze([]);

let lineas = VACIO;
let cargado = false;
let panelAbierto = false;
let escuchandoAlmacen = false;
const oyentes = new Set();

function avisar() {
  for (const oyente of oyentes) oyente();
}

function esLineaValida(l) {
  return (
    l &&
    typeof l.key === 'string' &&
    (l.tipo === 'producto' || l.tipo === 'accesorio') &&
    typeof l.id === 'string' &&
    typeof l.categoriaId === 'string' &&
    Number.isInteger(l.cantidad) &&
    l.cantidad > 0 &&
    Number.isFinite(l.precio)
  );
}

function leerTexto(texto) {
  try {
    const datos = JSON.parse(texto);
    if (Array.isArray(datos)) {
      const validas = datos.filter(esLineaValida);
      return validas.length ? validas : VACIO;
    }
  } catch {
    // JSON dañado: se empieza con el carrito vacío
  }
  return VACIO;
}

function obtenerLineas() {
  if (!cargado && typeof window !== 'undefined') {
    cargado = true;
    try {
      lineas = leerTexto(window.localStorage.getItem(CLAVE_ALMACEN));
    } catch {
      lineas = VACIO;
    }
  }
  return lineas;
}

function guardarLineas(nuevas) {
  lineas = nuevas.length ? nuevas : VACIO;
  try {
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lineas));
  } catch {
    // modo privado o almacenamiento lleno: el carrito sigue funcionando en memoria
  }
  avisar();
}

function suscribir(oyente) {
  oyentes.add(oyente);

  // Mantiene sincronizadas varias pestañas abiertas del sitio
  if (!escuchandoAlmacen && typeof window !== 'undefined') {
    escuchandoAlmacen = true;
    window.addEventListener('storage', (evento) => {
      if (evento.key === CLAVE_ALMACEN) {
        cargado = true;
        lineas = leerTexto(evento.newValue);
        avisar();
      }
    });
  }

  return () => {
    oyentes.delete(oyente);
  };
}

// ---------- Acciones (se pueden llamar desde cualquier componente de cliente) ----------

export function claveLinea(tipo, id, tallaId) {
  return `${tipo}:${id}:${tallaId ?? '-'}`;
}

function datosDeLinea(base) {
  return {
    key: base.key,
    tipo: base.tipo,
    id: base.id,
    tallaId: base.tallaId ?? null,
    tallaNombre: base.tallaNombre ?? null,
    genero: base.genero ?? null,
    nombre: base.nombre,
    precio: Number(base.precio),
    stock: base.stock,
    imagen_url: base.imagen_url ?? null,
    categoriaId: base.categoriaId,
    categoriaNombre: base.categoriaNombre,
    categoriaSlug: base.categoriaSlug,
  };
}

/**
 * Suma o resta `delta` unidades a una línea. Si no existe y delta > 0, la crea.
 * Si queda en 0, la elimina. Respeta el stock conocido de la talla y el máximo
 * por línea (el servidor vuelve a validar todo al enviar).
 */
export function ajustarLinea(base, delta) {
  const actuales = obtenerLineas();
  const indice = actuales.findIndex((l) => l.key === base.key);
  const stockConocido = Number.isFinite(base.stock) ? base.stock : MAX_POR_LINEA;
  const tope = Math.max(0, Math.min(stockConocido, MAX_POR_LINEA));

  if (indice === -1) {
    if (delta <= 0 || tope < 1) return;
    guardarLineas([
      ...actuales,
      { ...datosDeLinea(base), stock: tope, cantidad: Math.min(delta, tope) },
    ]);
    return;
  }

  const actual = actuales[indice];
  const nueva = delta > 0 ? Math.min(actual.cantidad + delta, tope) : actual.cantidad + delta;

  if (nueva <= 0) {
    guardarLineas(actuales.filter((_, i) => i !== indice));
    return;
  }

  const copia = [...actuales];
  copia[indice] = { ...actual, precio: Number(base.precio), stock: tope, cantidad: nueva };
  guardarLineas(copia);
}

export function quitarLinea(key) {
  guardarLineas(obtenerLineas().filter((l) => l.key !== key));
}

export function quitarZona(categoriaId) {
  guardarLineas(obtenerLineas().filter((l) => l.categoriaId !== categoriaId));
}

export function vaciarCarrito() {
  guardarLineas([]);
}

export function abrirCarrito() {
  panelAbierto = true;
  avisar();
}

export function cerrarCarrito() {
  panelAbierto = false;
  avisar();
}

// ---------- Hook de lectura ----------

export function useCarrito() {
  const lineasActuales = useSyncExternalStore(suscribir, obtenerLineas, () => VACIO);
  const abierto = useSyncExternalStore(
    suscribir,
    () => panelAbierto,
    () => false
  );

  return useMemo(() => {
    const porClave = new Map(lineasActuales.map((l) => [l.key, l]));
    const zonas = [];
    const zonaPorId = new Map();
    let unidades = 0;
    let total = 0;

    for (const l of lineasActuales) {
      unidades += l.cantidad;
      total += l.cantidad * l.precio;

      let zona = zonaPorId.get(l.categoriaId);
      if (!zona) {
        zona = {
          categoriaId: l.categoriaId,
          categoriaNombre: l.categoriaNombre,
          categoriaSlug: l.categoriaSlug,
          lineas: [],
          unidades: 0,
          subtotal: 0,
        };
        zonaPorId.set(l.categoriaId, zona);
        zonas.push(zona);
      }
      zona.lineas.push(l);
      zona.unidades += l.cantidad;
      zona.subtotal += l.cantidad * l.precio;
    }

    return {
      lineas: lineasActuales,
      zonas,
      unidades,
      total,
      abierto,
      cantidadDe: (key) => porClave.get(key)?.cantidad ?? 0,
      ajustarLinea,
      quitarLinea,
      quitarZona,
      vaciarCarrito,
      abrirCarrito,
      cerrarCarrito,
    };
  }, [lineasActuales, abierto]);
}
