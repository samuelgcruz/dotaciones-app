// components/BuscadorGlobal.jsx
// Buscador de la página de inicio: busca prendas y accesorios en TODAS las zonas con la
// búsqueda inteligente (lib/busqueda.js). Cada resultado lleva a su zona con la búsqueda ya hecha.
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { buscar, construirVocabulario, sugerirCorreccion } from '@/lib/busqueda';
import { ETIQUETA_GENERO, formatoPrecio } from '@/lib/formato';

const MAX_RESULTADOS = 8;

export default function BuscadorGlobal({ indice, consultaInicial = '' }) {
  const [consulta, setConsulta] = useState(consultaInicial);
  const termino = consulta.trim();

  const resultados = useMemo(() => (termino ? buscar(indice, termino, (i) => i.texto).map((r) => r.item) : []), [indice, termino]);
  const vocabulario = useMemo(() => construirVocabulario(indice.map((i) => i.texto)), [indice]);
  const correccion = termino && resultados.length === 0 ? sugerirCorreccion(termino, vocabulario) : null;
  const hayConCorreccion = correccion && buscar(indice, correccion, (i) => i.texto).length > 0;

  // Ejemplos para empezar: los primeros nombres distintos del catálogo
  const ejemplos = useMemo(() => {
    const vistos = new Set();
    const lista = [];
    for (const i of indice) {
      const clave = i.nombre.toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      lista.push(i.nombre);
      if (lista.length === 5) break;
    }
    return lista;
  }, [indice]);

  return (
    <div className="border-2 border-tinta bg-papel p-4 sm:p-5">
      <label htmlFor="buscar-global" className="font-display text-2xl font-bold uppercase leading-none">
        ¿Qué estás buscando?
      </label>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-acero" aria-hidden="true" />
        <input
          id="buscar-global"
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Ej. bata, pantalón, guantes, cofia…"
          autoComplete="off"
          className="w-full border-2 border-tinta bg-white py-3 pl-10 pr-12 text-lg"
        />
        {consulta && (
          <button
            type="button"
            onClick={() => setConsulta('')}
            aria-label="Borrar la búsqueda"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center border-2 border-tinta bg-papel hover:bg-seguridad"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        )}
      </div>

      {!termino && ejemplos.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-acero">
          Prueba con:
          {ejemplos.map((e) => (
            <button key={e} type="button" onClick={() => setConsulta(e)} className="border-2 border-tinta bg-white px-2 py-0.5 font-semibold text-tinta hover:bg-seguridad">
              {e}
            </button>
          ))}
        </p>
      )}

      <div aria-live="polite">
        {termino && resultados.length > 0 && (
          <>
            <p className="mt-3 text-sm text-acero">
              {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} en todas las zonas
              {resultados.length > MAX_RESULTADOS ? `; mostramos los ${MAX_RESULTADOS} más parecidos` : ''}
            </p>
            <ul className="mt-2 divide-y-2 divide-tinta/15 border-2 border-tinta bg-white">
              {resultados.slice(0, MAX_RESULTADOS).map((r) => (
                <li key={r.clave}>
                  <Link
                    href={`/categoria/${r.zonaSlug}?q=${encodeURIComponent(r.nombre)}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2.5 hover:bg-seguridad/40"
                  >
                    <span>
                      <strong className="font-semibold">{r.nombre}</strong>
                      {r.genero && r.genero !== 'unisex' ? ` (${ETIQUETA_GENERO[r.genero]})` : ''}
                      <span className="block text-sm text-acero">
                        {r.clase === 'prenda' ? 'Prenda' : 'Accesorio'} · {r.zonaNombre}
                      </span>
                    </span>
                    <span className="font-display text-xl font-bold tabular-nums">{formatoPrecio(r.precio)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {termino && resultados.length === 0 && (
          <div className="mt-3 border-2 border-tinta bg-white p-4">
            <p className="font-semibold">No encontramos «{termino}».</p>
            {hayConCorreccion && (
              <p className="mt-1">
                ¿Quisiste decir{' '}
                <button type="button" onClick={() => setConsulta(correccion)} className="font-bold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                  {correccion}
                </button>
                ?
              </p>
            )}
            <p className="mt-1 text-sm">
              ¿No lo tenemos?{' '}
              <Link href={`/sugerencias?nombre=${encodeURIComponent(termino)}`} className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                Sugiérenos este producto
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
