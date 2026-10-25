// components/Complementos.jsx
// "¿Falta algo en tu pedido?": sugerencias para completar la dotación de la zona, sacadas
// con reglas simples (lib/busqueda.js → sugerirComplementos): la otra versión de una prenda
// (pediste mujer, ¿y hombre?), tipos de prenda que aún no llevas y accesorios de la zona.
'use client';

import { useState } from 'react';
import { Lightbulb, Plus, X } from 'lucide-react';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { sugerirComplementos } from '@/lib/busqueda';
import { formatoPrecio } from '@/lib/formato';

function irA(ancla) {
  const el = document.querySelector(`[data-familia="${CSS.escape(ancla)}"]`) ?? document.getElementById(ancla);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function Complementos({ familias, accesorios, categoria }) {
  const { lineas, ajustarLinea } = useCarrito();
  const [oculto, setOculto] = useState(false);

  const sugerencias = sugerirComplementos({ familias, accesorios, lineas, zonaId: categoria.id });
  if (oculto || sugerencias.length === 0) return null;

  function agregarAccesorio(a) {
    ajustarLinea(
      {
        key: claveLinea('accesorio', a.id, null),
        tipo: 'accesorio',
        id: a.id,
        tallaId: null,
        tallaNombre: null,
        nombre: a.nombre,
        precio: Number(a.precio),
        stock: 99,
        imagen_url: a.imagen_url,
        categoriaId: categoria.id,
        categoriaNombre: categoria.nombre,
        categoriaSlug: categoria.slug,
      },
      1
    );
  }

  return (
    <aside aria-labelledby="complementos-titulo" className="mb-10 border-2 border-tinta bg-white">
      <div className="flex items-start justify-between gap-3 border-b-2 border-tinta bg-seguridad px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <h3 id="complementos-titulo" className="font-display text-2xl font-bold uppercase leading-none">
            ¿Falta algo en tu pedido?
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setOculto(true)}
          aria-label="Ocultar las sugerencias"
          className="grid h-7 w-7 shrink-0 place-items-center border-2 border-tinta hover:bg-tinta hover:text-seguridad"
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
      <ul className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
        {sugerencias.map((s) => (
          <li key={s.clave} className="-mb-px -mr-px flex flex-col justify-between gap-3 border-b border-r border-tinta/20 bg-white p-3">
            <div>
              <p className="font-semibold leading-tight">{s.titulo}</p>
              <p className="mt-0.5 text-xs text-acero">{s.motivo}</p>
              {s.accesorio && <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatoPrecio(Number(s.accesorio.precio))}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => irA(s.ancla)}
                className="border-2 border-tinta px-3 py-1 text-sm font-semibold hover:bg-tinta hover:text-papel"
              >
                Verlo
              </button>
              {s.accesorio && !s.accesorio.requiere_talla && (
                <button
                  type="button"
                  onClick={() => agregarAccesorio(s.accesorio)}
                  className="inline-flex items-center gap-1 border-2 border-tinta bg-tinta px-3 py-1 text-sm font-semibold text-papel hover:bg-seguridad hover:text-tinta"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Agregar 1
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
