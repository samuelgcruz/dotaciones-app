// lib/guiaTallas.js
// Datos de la guía de tallas. PROYECTO ACADÉMICO: son medidas y equivalencias de EJEMPLO,
// no corresponden a ninguna marca ni fabricante real. Cambia los números aquí si algún día
// quieres usar los de tu proveedor.

export const GENEROS_GUIA = [
  { valor: 'mujer', etiqueta: 'Mujer' },
  { valor: 'hombre', etiqueta: 'Hombre' },
];

// Medidas del cuerpo en centímetros (la guía convierte a pulgadas cuando se pide).
// Orden: pecho (busto en mujer), cintura, cadera.
export const MEDIDAS_CM = {
  mujer: [
    { talla: 'XS', pecho: 80, cintura: 62, cadera: 88 },
    { talla: 'S', pecho: 84, cintura: 66, cadera: 92 },
    { talla: 'M', pecho: 88, cintura: 70, cadera: 96 },
    { talla: 'L', pecho: 94, cintura: 76, cadera: 102 },
    { talla: 'XL', pecho: 100, cintura: 82, cadera: 108 },
    { talla: 'XXL', pecho: 106, cintura: 88, cadera: 114 },
    { talla: '3XL', pecho: 112, cintura: 94, cadera: 120 },
  ],
  hombre: [
    { talla: 'XS', pecho: 84, cintura: 70, cadera: 88 },
    { talla: 'S', pecho: 90, cintura: 76, cadera: 94 },
    { talla: 'M', pecho: 96, cintura: 82, cadera: 100 },
    { talla: 'L', pecho: 104, cintura: 90, cadera: 106 },
    { talla: 'XL', pecho: 112, cintura: 98, cadera: 112 },
    { talla: 'XXL', pecho: 120, cintura: 106, cadera: 118 },
    { talla: '3XL', pecho: 128, cintura: 114, cadera: 124 },
  ],
};

// Equivalencias entre la talla en letras y la numeración de cada país.
export const EQUIVALENCIAS = {
  mujer: [
    { talla: 'XS', co: '6', us: '0 – 2', eu: '32 – 34', uk: '4 – 6' },
    { talla: 'S', co: '8 – 10', us: '4 – 6', eu: '36', uk: '8 – 10' },
    { talla: 'M', co: '12', us: '8 – 10', eu: '38 – 40', uk: '12 – 14' },
    { talla: 'L', co: '14 – 16', us: '12 – 14', eu: '42 – 44', uk: '16 – 18' },
    { talla: 'XL', co: '18', us: '16', eu: '46', uk: '20' },
    { talla: 'XXL', co: '20', us: '18', eu: '48', uk: '22' },
    { talla: '3XL', co: '22', us: '20', eu: '50', uk: '24' },
  ],
  hombre: [
    { talla: 'XS', co: '28', us: '34', eu: '44', uk: '34' },
    { talla: 'S', co: '30', us: '36', eu: '46', uk: '36' },
    { talla: 'M', co: '32 – 34', us: '38 – 40', eu: '48 – 50', uk: '38 – 40' },
    { talla: 'L', co: '36', us: '42', eu: '52', uk: '42' },
    { talla: 'XL', co: '38 – 40', us: '44', eu: '54 – 56', uk: '44' },
    { talla: 'XXL', co: '42', us: '46', eu: '58', uk: '46' },
    { talla: '3XL', co: '44', us: '48', eu: '60', uk: '48' },
  ],
};

// Calzado: la numeración de Colombia coincide con la europea.
export const CALZADO = Array.from({ length: 12 }, (_, i) => {
  const eu = 35 + i;
  const usHombre = eu - 33;
  return {
    eu,
    usHombre,
    usMujer: usHombre + 1.5,
    uk: usHombre - 0.5,
    pieCm: Math.round((25 + (eu - 40) * 0.667) * 10) / 10,
  };
});

export const PASOS_MEDIRSE = [
  { titulo: 'Pecho o busto', texto: 'Rodea la parte más ancha del pecho con la cinta, por debajo de las axilas y sin apretar. Mantén la cinta recta en la espalda.' },
  { titulo: 'Cintura', texto: 'Mide la parte más angosta del torso, a la altura del ombligo. Respira normal; no metas el abdomen.' },
  { titulo: 'Cadera', texto: 'Rodea la parte más ancha de la cadera, con los pies juntos y la cinta paralela al suelo.' },
  { titulo: 'Pie', texto: 'Apoya el pie sobre una hoja, marca el talón y el dedo más largo y mide la distancia. Hazlo al final del día, cuando el pie está más grande.' },
];

export const CONSEJOS = [
  'Mide sobre ropa ligera o sin ropa y pide ayuda: medirse solo suele dar números más grandes.',
  'Si tus medidas quedan entre dos tallas, elige la mayor, sobre todo en prendas que van sobre otra ropa, como las batas.',
  'Las prendas unisex tienen una sola horma: usa la tabla que más se parezca a tus medidas.',
];

export const cmAPulgadas = (cm) => Math.round((cm / 2.54) * 10) / 10;

// Talla recomendada: la más pequeña que cubre el pecho y la cintura medidos (en cm).
// Devuelve { talla, entreDos } o null si las medidas superan la tabla.
export function recomendarTalla(genero, pechoCm, cinturaCm) {
  const tabla = MEDIDAS_CM[genero] ?? MEDIDAS_CM.mujer;
  const pecho = Number(pechoCm);
  const cintura = Number(cinturaCm);
  if (!Number.isFinite(pecho) || pecho <= 0) return null;

  const porPecho = tabla.findIndex((f) => pecho <= f.pecho);
  if (porPecho === -1) return null;
  let indice = porPecho;

  if (Number.isFinite(cintura) && cintura > 0) {
    const porCintura = tabla.findIndex((f) => cintura <= f.cintura);
    if (porCintura === -1) return null;
    indice = Math.max(porPecho, porCintura);
  }
  return { talla: tabla[indice].talla, entreDos: indice !== porPecho };
}
