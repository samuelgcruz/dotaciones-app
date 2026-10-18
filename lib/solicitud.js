// lib/solicitud.js
// Lógica pura de la solicitud especial: tipos de necesidad (bloques), resumen de
// cada bloque, validación de datos y armado del mensaje. No usa la base de datos.
import { formatoNumero } from './formato';

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
      linea = `${art.nombre}: ${filas.map((f) => `talla ${f.t.nombre} ${formatoNumero(f.cant)}`).join(', ')}`;
    } else {
      total = Number(bloque.cantidad) || 0;
      if (total < 1) return { ...resumen, falta: 'Indica la cantidad.' };
      linea = `${art.nombre}: ${formatoNumero(total)} unidades`;
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
    lineas.push(`- ${i.nombre}: ${i.por} por equipo, ${formatoNumero(equipos * i.por)} unidades`);
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

export function validarDatos(datos) {
  const errores = {};
  if (!datos.empresa.trim()) errores.empresa = 'Escribe el nombre de la empresa.';
  if (!datos.contacto.trim()) errores.contacto = 'Escribe el nombre de la persona de contacto.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Escribe un correo válido.';
  if (datos.numero.replace(/\D/g, '').length < 7) errores.numero = 'Escribe un celular válido, sin el indicativo.';
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
