// app/categoria/[slug]/CategoriaClient.jsx
// Cuerpo de la zona: barra de navegación fija (secciones + filtro por tipo de
// prenda), fichas de prendas y fichas de accesorios. Todo lo que se elige va al
// carrito global (lib/carrito.js), así que se conserva al cambiar de zona.
'use client';

import { useState } from 'react';
import SizeSelector from '@/components/SizeSelector';
import AccessoriesSelector from '@/components/AccessoriesSelector';

function Encabezado({ id, titulo, cantidad, texto }) {
  return (
    <div className="mb-6">
      <div className="flex items-end gap-4">
        <h3 id={id} className="font-display text-4xl font-bold uppercase leading-none">
          {titulo}
        </h3>
        <span className="mb-0.5 border-2 border-tinta bg-seguridad px-2 font-display text-xl font-bold leading-7 tabular-nums">
          {cantidad}
        </span>
        <span aria-hidden="true" className="mb-2 h-0.5 flex-1 bg-tinta" />
      </div>
      <p className="mt-2 max-w-xl text-sm text-acero">{texto}</p>
    </div>
  );
}

export default function CategoriaClient({ categoria, productos, accesorios }) {
  const zona = { id: categoria.id, nombre: categoria.nombre, slug: categoria.slug };

  const [tipo, setTipo] = useState('todas');
  const tipos = [...new Set(productos.map((p) => p.tipo_prenda))];
  const visibles = tipo === 'todas' ? productos : productos.filter((p) => p.tipo_prenda === tipo);

  const claveChip = (activo) =>
    `shrink-0 border-2 border-tinta px-3 py-1 text-sm font-semibold capitalize transition-colors ${
      activo ? 'bg-tinta text-papel' : 'bg-white hover:bg-seguridad'
    }`;

  return (
    <div>
      {/* Barra fija: saltar entre secciones y filtrar prendas */}
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-10 border-y-2 border-tinta bg-papel px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2.5">
          <nav aria-label="Secciones de la zona" className="flex gap-4">
            <a
              href="#prendas"
              className="font-display text-xl font-bold uppercase leading-none underline-offset-4 hover:underline"
            >
              Prendas ({productos.length})
            </a>
            <a
              href="#accesorios"
              className="font-display text-xl font-bold uppercase leading-none underline-offset-4 hover:underline"
            >
              Accesorios ({accesorios.length})
            </a>
          </nav>

          {tipos.length > 1 && (
            <div role="group" aria-label="Filtrar prendas por tipo" className="flex gap-1.5 overflow-x-auto sm:ml-auto sm:flex-wrap">
              <button
                type="button"
                aria-pressed={tipo === 'todas'}
                onClick={() => setTipo('todas')}
                className={claveChip(tipo === 'todas')}
              >
                Todas
              </button>
              {tipos.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tipo === t}
                  onClick={() => setTipo(t)}
                  className={claveChip(tipo === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-16">
        <section id="prendas" aria-labelledby="titulo-prendas" className="scroll-mt-36">
          <Encabezado
            id="titulo-prendas"
            titulo="Prendas"
            cantidad={visibles.length}
            texto="Elige una talla en cada prenda e indica cuántas unidades necesitas. Puedes pedir la misma prenda en varias tallas."
          />

          {productos.length === 0 ? (
            <p className="border-2 border-tinta bg-papel p-8 text-acero">
              Esta zona todavía no tiene prendas publicadas.
            </p>
          ) : (
            <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((producto) => (
                <SizeSelector key={producto.id} producto={producto} categoria={zona} />
              ))}
            </div>
          )}
        </section>

        <section id="accesorios" aria-labelledby="titulo-accesorios" className="scroll-mt-36">
          <Encabezado
            id="titulo-accesorios"
            titulo="Accesorios"
            cantidad={accesorios.length}
            texto={`Complementos propios de ${categoria.nombre}. Súmalos en la cantidad que necesites.`}
          />
          <AccessoriesSelector accesorios={accesorios} categoria={zona} />
        </section>
      </div>
    </div>
  );
}
