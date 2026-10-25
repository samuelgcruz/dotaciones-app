// lib/solicitud.js
// Lógica pura de la solicitud especial: tipos de necesidad (bloques), resumen de
// cada bloque, validación de datos y armado del mensaje. No usa la base de datos:
// la usan tanto la pantalla (para mostrar el resumen) como el servidor (para recalcular
// y validar antes de guardar en solicitudes_especiales).
import { compararNombresTalla, ETIQUETA_GENERO, etiquetaTipo, formatoNumero, normalizarGenero } from './formato';

export const TIPOS_BLOQUE = {
  catalogo: {
    titulo: 'Más unidades del catálogo',
    ayuda: 'Elige una prenda o accesorio y pide la cantidad por talla.',
  },
  equipo: {
    titulo: 'Equipos completos',
    ayuda: 'La dotación completa de una zona para varias personas.',
  },
  medida: {
    titulo: 'A la medida',
    ayuda: 'Algo que no está en el catálogo.',
  },
};

export const MAX_BLOQUES = 12;

// Nombre con el género cuando importa: "Bata médica (Mujer)". Los unisex y los accesorios van sin sufijo.
export function nombreArticulo(a) {
  const g = normalizarGenero(a?.genero);
  return g === 'unisex' ? a.nombre : `${a.nombre} (${ETIQUETA_GENERO[g]})`;
}

// Convierte el catálogo (categorías con prendas y accesorios) en las "zonas" simples
// y serializables que usa la solicitud, en la pantalla y en el servidor.
export function construirZonas(catalogo) {
  return catalogo.map(({ categoria, productos, accesorios }) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    slug: categoria.slug,
    prendas: productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      genero: normalizarGenero(p.genero),
      tipo: etiquetaTipo(p.tipo_prenda),
      descripcion: p.descripcion ?? '',
      precio: Number(p.precio_base),
      tallas: [...p.producto_tallas]
        .sort((a, b) => compararNombresTalla(a.tallas.nombre, b.tallas.nombre))
        .map((pt) => ({ id: pt.tallas.id, nombre: pt.tallas.nombre, stock: pt.stock })),
    })),
    accesorios: accesorios.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      descripcion: a.descripcion ?? '',
      precio: Number(a.precio),
    })),
  }));
}

export function bloqueNuevo(tipo, id, base = {}) {
  if (tipo === 'catalogo') {
    return { id, tipo, zonaId: '', articuloKey: '', tallas: {}, cantidad: '', detalle: '', ...base };
  }
  if (tipo === 'equipo') {
    return { id, tipo, zonaId: '', equipos: '', incluye: {}, tallasTexto: '', ...base };
  }
  return { id, tipo: 'medida', articulo: '', cantidad: '', detalle: '', ...base };
}

// Equipo por defecto: todas las prendas de la zona, una por persona; accesorios sin marcar
export function incluyeInicial(zona) {
  const incluye = {};
  for (const p of zona.prendas) incluye[`p:${p.id}`] = 1;
  for (const a of zona.accesorios) incluye[`a:${a.id}`] = 0;
  return incluye;
}

// Las claves de artículo son "p:<id>" (prenda) o "a:<id>" (accesorio)
export function buscarArticulo(zona, key) {
  if (!zona || !key) return null;
  const id = key.slice(2);
  if (key.startsWith('p:')) {
    const p = zona.prendas.find((x) => x.id === id);
    return p ? { ...p, esPrenda: true, key } : null;
  }
  const a = zona.accesorios.find((x) => x.id === id);
  return a ? { ...a, esPrenda: false, key } : null;
}

export function resumenBloque(bloque, zonaPorId) {
  const meta = TIPOS_BLOQUE[bloque.tipo];
  const resumen = { etiqueta: meta.titulo, lineas: [], total: 0, referencia: 0, listo: false, falta: '' };

  if (bloque.tipo === 'medida') {
    const cantidad = Number(bloque.cantidad) || 0;
    if (!bloque.articulo.trim()) return { ...resumen, falta: 'Describe qué necesitas.' };
    if (cantidad < 1) return { ...resumen, falta: 'Indica la cantidad.' };
    const lineas = [`${bloque.articulo.trim()}: ${formatoNumero(cantidad)} unidades`];
    if (bloque.detalle.trim()) lineas.push(`Detalle: ${bloque.detalle.trim()}`);
    return { ...resumen, lineas, total: cantidad, listo: true };
  }

  const zona = zonaPorId.get(bloque.zonaId);
  if (!zona) return { ...resumen, falta: 'Elige la zona de trabajo.' };
  resumen.etiqueta = `${meta.titulo}: ${zona.nombre}`;

  if (bloque.tipo === 'catalogo') {
    const art = buscarArticulo(zona, bloque.articuloKey);
    if (!art) return { ...resumen, falta: 'Elige el artículo.' };

    let total = 0;
    let linea;
    if (art.esPrenda) {
      const filas = art.tallas
        .map((t) => ({ t, cant: Number(bloque.tallas[t.id]) || 0 }))
        .filter((f) => f.cant > 0);
      total = filas.reduce((acc, f) => acc + f.cant, 0);
      if (total < 1) return { ...resumen, falta: 'Indica la cantidad en al menos una talla.' };
      linea = `${nombreArticulo(art)}: ${filas.map((f) => `talla ${f.t.nombre} ${formatoNumero(f.cant)}`).join(', ')}`;
    } else {
      total = Number(bloque.cantidad) || 0;
      if (total < 1) return { ...resumen, falta: 'Indica la cantidad.' };
      linea = `${nombreArticulo(art)}: ${formatoNumero(total)} unidades`;
    }
    const lineas = [linea];
    if (bloque.detalle.trim()) lineas.push(`Detalle: ${bloque.detalle.trim()}`);
    return { ...resumen, lineas, total, referencia: total * art.precio, listo: true };
  }

  // equipo completo
  const equipos = Number(bloque.equipos) || 0;
  if (equipos < 1) return { ...resumen, falta: 'Indica cuántos equipos necesitas.' };
  const items = [...zona.prendas.map((p) => ({ ...p, key: `p:${p.id}` })), ...zona.accesorios.map((a) => ({ ...a, key: `a:${a.id}` }))]
    .map((a) => ({ ...a, por: Number(bloque.incluye[a.key]) || 0 }))
    .filter((a) => a.por > 0);
  if (items.length === 0) return { ...resumen, falta: 'Marca al menos un artículo del equipo.' };

  const lineas = [`${formatoNumero(equipos)} equipos. Cada equipo incluye:`];
  for (const i of items) {
    lineas.push(`- ${nombreArticulo(i)}: ${i.por} por equipo, ${formatoNumero(equipos * i.por)} unidades`);
  }
  if (bloque.tallasTexto.trim()) lineas.push(`Distribución de tallas: ${bloque.tallasTexto.trim()}`);
  return {
    ...resumen,
    lineas,
    total: items.reduce((acc, i) => acc + equipos * i.por, 0),
    referencia: items.reduce((acc, i) => acc + equipos * i.por * i.precio, 0),
    listo: true,
  };
}

// Fecha de hoy (AAAA-MM-DD) en hora de Colombia, para comparar con el campo de fecha.
function hoyEnColombia() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

export function validarDatos(datos) {
  const errores = {};
  if (!datos.empresa.trim()) errores.empresa = 'Escribe el nombre de la empresa.';
  if (!datos.contacto.trim()) errores.contacto = 'Escribe el nombre de la persona de contacto.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Escribe un correo válido.';
  if (datos.numero.replace(/\D/g, '').length < 7) errores.numero = 'Escribe un celular válido, sin el indicativo.';
  if (datos.fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || Number.isNaN(Date.parse(datos.fecha))) {
      errores.fecha = 'La fecha no es válida.';
    } else if (datos.fecha < hoyEnColombia()) {
      errores.fecha = 'La fecha en que lo necesitas ya pasó.';
    }
  }
  return errores;
}

function fechaLegible(iso) {
  const [a, m, d] = String(iso).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

export function armarMensaje(formato, datos, resumenes) {
  const n = (t) => (formato === 'whatsapp' ? `*${t}*` : t);
  const filas = [
    n('SOLICITUD ESPECIAL DE DOTACIÓN'),
    '',
    `${n('Empresa:')} ${datos.empresa.trim()}`,
    datos.nit.trim() ? `${n('NIT:')} ${datos.nit.trim()}` : null,
    `${n('Contacto:')} ${datos.contacto.trim()}`,
    `${n('Correo:')} ${datos.email.trim()}`,
    `${n('Celular:')} ${datos.prefijo} ${datos.numero.replace(/\D/g, '')}`,
    datos.ciudad.trim() ? `${n('Ciudad de entrega:')} ${datos.ciudad.trim()}` : null,
    datos.fecha ? `${n('Fecha requerida:')} ${fechaLegible(datos.fecha)}` : null,
    '',
    n('Necesidades:'),
  ];

  resumenes.forEach((r, i) => {
    filas.push('', `${i + 1}. ${n(r.etiqueta)}`);
    for (const l of r.lineas) filas.push(`   ${l}`);
    filas.push(`   Total: ${formatoNumero(r.total)} unidades`);
  });

  const total = resumenes.reduce((acc, r) => acc + r.total, 0);
  filas.push('', `${n('Total general:')} ${formatoNumero(total)} unidades`);
  if (datos.notas.trim()) filas.push('', `${n('Notas:')} ${datos.notas.trim()}`);

  return filas.filter((f) => f !== null).join('\n');
}


// ---------------------------------------------------------------------------
// Limpieza de lo que llega del navegador (se usa en el servidor antes de guardar).
// ---------------------------------------------------------------------------
const texto = (v, max) => String(v ?? '').trim().slice(0, max);
const digitos = (v, max) => String(v ?? '').replace(/\D/g, '').slice(0, max);

export function sanearDatosSolicitud(d) {
  const prefijo = texto(d?.prefijo, 6);
  return {
    empresa: texto(d?.empresa, 120),
    nit: texto(d?.nit, 30),
    contacto: texto(d?.contacto, 120),
    email: texto(d?.email, 160),
    prefijo: /^\+\d{1,4}$/.test(prefijo) ? prefijo : '+57',
    numero: digitos(d?.numero, 15),
    ciudad: texto(d?.ciudad, 80),
    fecha: texto(d?.fecha, 10),
    notas: texto(d?.notas, 800),
  };
}

// Solo deja pasar los campos que cada tipo de necesidad realmente usa, con largos limitados.
function mapaDeCantidades(obj, maxClaves, maxDigitos) {
  const salida = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return salida;
  for (const [clave, valor] of Object.entries(obj).slice(0, maxClaves)) {
    const cantidad = digitos(valor, maxDigitos);
    if (cantidad !== '') salida[texto(clave, 64)] = cantidad;
  }
  return salida;
}

export function sanearBloques(bloques) {
  if (!Array.isArray(bloques)) return [];
  return bloques.slice(0, MAX_BLOQUES).flatMap((b, i) => {
    const id = i + 1;
    if (b?.tipo === 'catalogo') {
      return [
        bloqueNuevo('catalogo', id, {
          zonaId: texto(b.zonaId, 64),
          articuloKey: texto(b.articuloKey, 70),
          tallas: mapaDeCantidades(b.tallas, 60, 6),
          cantidad: digitos(b.cantidad, 6),
          detalle: texto(b.detalle, 400),
        }),
      ];
    }
    if (b?.tipo === 'equipo') {
      return [
        bloqueNuevo('equipo', id, {
          zonaId: texto(b.zonaId, 64),
          equipos: digitos(b.equipos, 6),
          incluye: mapaDeCantidades(b.incluye, 120, 3),
          tallasTexto: texto(b.tallasTexto, 400),
        }),
      ];
    }
    if (b?.tipo === 'medida') {
      return [
        bloqueNuevo('medida', id, {
          articulo: texto(b.articulo, 200),
          cantidad: digitos(b.cantidad, 6),
          detalle: texto(b.detalle, 400),
        }),
      ];
    }
    return [];
  });
}
