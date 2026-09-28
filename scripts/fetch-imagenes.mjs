// scripts/fetch-imagenes.mjs
//
// Busca en la API oficial de Unsplash una foto real y relevante para cada
// producto y accesorio, y genera las sentencias SQL necesarias para
// actualizarlos en Supabase.
//
// USO:
//   1. Agrega esta linea a tu archivo .env.local (con tu Access Key real):
//        UNSPLASH_ACCESS_KEY=tu_access_key_aqui
//   2. Ejecuta en la terminal (dentro de dotaciones-app):
//        node scripts/fetch-imagenes.mjs > actualizar-fotos-finales.sql
//   3. Abre el archivo actualizar-fotos-finales.sql que se creo, copia todo
//      su contenido, y pegalo en el SQL Editor de Supabase. Dale Run.

import { readFileSync } from 'fs';

function cargarEnvLocal() {
  try {
    const contenido = readFileSync('.env.local', 'utf-8');
    for (const linea of contenido.split('\n')) {
      const match = linea.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const clave = match[1].trim();
        const valor = match[2].trim();
        if (!process.env[clave]) process.env[clave] = valor;
      }
    }
  } catch {
    // Si el archivo no existe, seguimos sin cargar nada.
  }
}

cargarEnvLocal();

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!ACCESS_KEY) {
  console.error('Falta UNSPLASH_ACCESS_KEY en tu archivo .env.local.');
  process.exit(1);
}

const items = [
  { tabla: 'productos', valor: 'Filipina Medica Antifluidos', query: 'medical scrub top nurse', ancho: 400 },
  { tabla: 'productos', valor: 'Pantalon Medico Antifluidos', query: 'medical scrub pants nurse', ancho: 400 },
  { tabla: 'productos', valor: 'Camisa Jean de Trabajo', query: 'denim work shirt worker', ancho: 400 },
  { tabla: 'productos', valor: 'Pantalon de Dril Industrial', query: 'cargo work pants construction', ancho: 400 },
  { tabla: 'productos', valor: 'Filipina Chef Ejecutiva', query: 'chef jacket white uniform', ancho: 400 },
  { tabla: 'productos', valor: 'Pantalon Cocina Pinstripe', query: 'chef pants checkered kitchen', ancho: 400 },
  { tabla: 'productos', valor: 'Camisa Ejecutiva Oxford', query: 'oxford dress shirt business', ancho: 400 },
  { tabla: 'productos', valor: 'Pantalon Formal de Vestir', query: 'formal dress pants business', ancho: 400 },
  { tabla: 'accesorios', valor: 'Gorro quirurgico', query: 'surgical cap medical', ancho: 200 },
  { tabla: 'accesorios', valor: 'Tapabocas', query: 'surgical face mask', ancho: 200 },
  { tabla: 'accesorios', valor: 'Zuecos', query: 'medical clogs shoes', ancho: 200 },
  { tabla: 'accesorios', valor: 'Guantes de carnaza', query: 'leather work gloves', ancho: 200 },
  { tabla: 'accesorios', valor: 'Casco', query: 'construction hard hat helmet', ancho: 200 },
  { tabla: 'accesorios', valor: 'Botas punta de acero', query: 'steel toe work boots', ancho: 200 },
];

async function buscarFoto(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });
  if (!res.ok) throw new Error(`Error de Unsplash (${res.status}) para "${query}"`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0].urls.raw;
}

async function main() {
  console.log('-- SQL generado automaticamente por fetch-imagenes.mjs');
  console.log('-- Copia todo esto y pegalo en el SQL Editor de Supabase\n');

  for (const item of items) {
    try {
      const rawUrl = await buscarFoto(item.query);
      if (!rawUrl) {
        console.log(`-- No se encontro foto para: ${item.valor}`);
        continue;
      }
      const finalUrl = `${rawUrl}&w=${item.ancho}&q=80&auto=format&fit=crop`;
      const valorEscapado = item.valor.replace(/'/g, "''");
      console.log(
        `update ${item.tabla} set imagen_url = '${finalUrl}' where nombre = '${valorEscapado}';`
      );
    } catch (err) {
      console.log(`-- Error con "${item.valor}": ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

main();
