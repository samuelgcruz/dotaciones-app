// lib/sugerencias.js
// Reglas de la sección "Sugerir un producto": limpieza y validación. Lógica pura: la usan
// tanto la pantalla (para avisar de errores) como el servidor (antes de guardar).

export const TIPOS_SUGERENCIA = [
  { valor: 'prenda', etiqueta: 'Una prenda' },
  { valor: 'accesorio', etiqueta: 'Un accesorio' },
  { valor: 'otro', etiqueta: 'Otra cosa' },
];

export const GENEROS_SUGERENCIA = [
  { valor: 'mujer', etiqueta: 'Mujer' },
  { valor: 'hombre', etiqueta: 'Hombre' },
  { valor: 'unisex', etiqueta: 'Unisex' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const texto = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export function sanearSugerencia(d) {
  const tipo = TIPOS_SUGERENCIA.some((t) => t.valor === d?.tipo) ? d.tipo : 'prenda';
  const genero = tipo === 'prenda' && GENEROS_SUGERENCIA.some((g) => g.valor === d?.genero) ? d.genero : '';
  return {
    nombre: texto(d?.nombre, 120),
    zonaId: texto(d?.zonaId, 64),
    tipo,
    genero,
    descripcion: String(d?.descripcion ?? '').trim().slice(0, 800),
    cantidad: String(d?.cantidad ?? '').replace(/\D/g, '').slice(0, 6),
    empresa: texto(d?.empresa, 120),
    contacto: texto(d?.contacto, 120),
    email: texto(d?.email, 160),
    telefono: String(d?.telefono ?? '').replace(/[^\d+]/g, '').slice(0, 16),
  };
}

export function validarSugerencia(d) {
  const e = {};
  if (d.nombre.length < 3) e.nombre = 'Escribe cómo se llama lo que necesitas (mínimo 3 letras).';
  if (d.descripcion.length < 10) e.descripcion = 'Cuéntanos un poco más: para qué lo necesitas y cómo lo imaginas (mínimo 10 letras).';
  if (d.empresa.length < 2) e.empresa = 'Escribe el nombre de tu empresa.';
  if (d.contacto.length < 2) e.contacto = 'Escribe tu nombre.';
  if (!EMAIL.test(d.email)) e.email = 'Escribe un correo válido, como nombre@empresa.com.';
  if (d.telefono && d.telefono.replace(/\D/g, '').length < 7) e.telefono = 'El celular parece incompleto.';
  if (d.cantidad && Number(d.cantidad) < 1) e.cantidad = 'La cantidad debe ser mayor que cero.';
  return e;
}
