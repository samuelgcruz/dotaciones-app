// app/categoria/[slug]/CategoriaClient.jsx
// Cuerpo de la zona. Las prendas se agrupan por tipo (camisas, pantalones...) y la barra
// fija acompaña el scroll, bajando y subiendo contigo: ahí está siempre a la vista el
// selector de género (solo afecta a las prendas) y los saltos a cada grupo y a los accesorios.
// Los accesorios son independientes del género. Todo va al carrito global (lib/carrito.js).
// Arriba hay un buscador inteligente (tildes, plurales, errores de tecleo y sinónimos) que
// filtra prendas y accesorios a la vez, y "¿Falta algo en tu pedido?" sugiere complementos.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import Complementos from '@/components/Complementos';
import SizeSelector from '@/components/SizeSelector';
import AccessoriesSelector from '@/components/AccessoriesSelector';
import { buscar, construirVocabulario, sugerirCorreccion } from '@/lib/busqueda';
import { armarFamilias, filtrarFamilias, hayPrendasPorGenero, textoBuscable, VISTAS } from '@/lib/catalogo';
import { etiquetaTipo } from '@/lib/formato';

const CLAVE_VISTA = 'dotaciones-genero-v1';

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
      {texto && <p className="mt-2 max-w-xl text-sm text-acero">{texto}</p>}
    </div>
  );
}

export default function CategoriaClient({ categoria, productos, accesorios, tallas, consultaInicial = '' }) {
  const zona = { id: categoria.id, nombre: categoria.nombre, slug: categoria.slug };

  // Género elegido. Se recuerda al cambiar de zona; por defecto se ven ambos.
  const [consulta, setConsulta] = useState(consultaInicial);
  const [vista, setVista] = useState('ambos');
  useEffect(() => {
    try {
      const guardada = window.localStorage.getItem(CLAVE_VISTA);
      if (VISTAS.some((v) => v.valor === guardada)) setVista(guardada);
    } catch {
      // sin almacenamiento: se queda en "ambos"
    }
  }, []);
  function elegirVista(valor) {
    setVista(valor);
    try {
      window.localStorage.setItem(CLAVE_VISTA, valor);
    } catch {
      // modo privado: el filtro igual funciona
    }
  }

  const hayGenero = hayPrendasPorGenero(productos);
  const familias = useMemo(() => armarFamilias(productos), [productos]);
  const visibles = hayGenero ? filtrarFamilias(familias, vista) : familias;
  const conteo = (valor) => filtrarFamilias(familias, valor).length;

  // Búsqueda: una familia coincide si alguna de sus versiones coincide
  const textoFamilia = (f) =>
    f.variantes.map((v) => textoBuscable({ nombre: v.nombre, descripcion: v.descripcion, tipo: etiquetaTipo(v.tipo_prenda), genero: v.genero })).join(' ');
  const textoAccesorio = (a) => textoBuscable({ nombre: a.nombre, descripcion: a.descripcion, tipo: 'accesorio' });
  const termino = consulta.trim();
  const familiasBuscadas = termino ? buscar(visibles, termino, textoFamilia).map((r) => r.item) : visibles;
  const accesoriosBuscados = termino ? buscar(accesorios, termino, textoAccesorio).map((r) => r.item) : accesorios;
  const sinResultados = termino && familiasBuscadas.length === 0 && accesoriosBuscados.length === 0;

  // Si no hay resultados: ¿quisiste decir…? y ¿hay algo en el otro género?
  const vocabulario = useMemo(
    () => construirVocabulario([...familias.map(textoFamilia), ...accesorios.map(textoAccesorio)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [familias, accesorios]
  );
  const correccion = sinResultados ? sugerirCorreccion(termino, vocabulario) : null;
  const hayConCorreccion = correccion && (buscar(familias, correccion, textoFamilia).length > 0 || buscar(accesorios, correccion, textoAccesorio).length > 0);
  const enOtroGenero = sinResultados && hayGenero && vista !== 'ambos' && buscar(familias, termino, textoFamilia).length > 0;

  // Grupos de prendas por tipo, en el orden en que aparecen
  const grupos = [];
  for (const f of familiasBuscadas) {
    const etiqueta = etiquetaTipo(f.tipo);
    let grupo = grupos.find((g) => g.etiqueta === etiqueta);
    if (!grupo) {
      grupo = { etiqueta, familias: [] };
      grupos.push(grupo);
    }
    grupo.familias.push(f);
  }

  const hayPares = familiasBuscadas.some((f) => f.variantes.length > 1);
  const enlace = 'shrink-0 font-display text-xl font-bold uppercase leading-none underline-offset-4 hover:underline';

  return (
    <div>
      {/* Barra fija: acompaña el scroll hacia abajo y hacia arriba */}
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-10 border-y-2 border-tinta bg-papel px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-x-8 gap-y-1 py-2 lg:flex-row lg:items-center">
          {hayGenero ? (
            <div role="radiogroup" aria-label="Prendas para" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 lg:shrink-0">
              <span className="w-full text-sm font-semibold sm:w-auto">Prendas para</span>
              <div className="flex w-full border-2 border-tinta sm:w-auto">
                {VISTAS.map((v, i) => {
                  const activa = vista === v.valor;
                  return (
                    <button
                      key={v.valor}
                      type="button"
                      role="radio"
                      aria-checked={activa}
                      onClick={() => elegirVista(v.valor)}
                      className={`flex-1 px-2 py-1.5 font-display text-base font-bold uppercase leading-none transition-colors sm:flex-none sm:px-3.5 sm:text-lg ${
                        i > 0 ? 'border-l-2 border-tinta' : ''
                      } ${activa ? 'bg-tinta text-papel' : 'bg-white hover:bg-seguridad'}`}
                    >
                      {v.etiqueta}
                      {v.valor !== 'ambos' && (
                        <span className={`ml-1.5 text-sm font-semibold tabular-nums ${activa ? 'text-seguridad' : 'text-acero'}`}>
                          {conteo(v.valor)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="shrink-0 text-sm font-semibold">Todas las prendas de esta zona son unisex</p>
          )}

          <nav aria-label="Secciones de la zona" className="flex gap-5 overflow-x-auto py-2 lg:py-1">
            {grupos.map((g, i) => (
              <a key={g.etiqueta} href={`#grupo-${i}`} className={enlace}>
                {g.etiqueta} ({g.familias.length})
              </a>
            ))}
            <a href="#accesorios" className={enlace}>
              Accesorios ({accesoriosBuscados.length})
            </a>
          </nav>
        </div>
      </div>

      {/* Buscador de la zona */}
      <div className="mb-8">
        <label htmlFor="buscar-zona" className="mb-1 block text-sm font-semibold">
          Buscar en {categoria.nombre}
        </label>
        <div className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-acero" aria-hidden="true" />
          <input
            id="buscar-zona"
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
        <p aria-live="polite" className="mt-2 min-h-5 text-sm text-acero">
          {termino && !sinResultados &&
            `${familiasBuscadas.length} ${familiasBuscadas.length === 1 ? 'prenda' : 'prendas'} y ${accesoriosBuscados.length} ${accesoriosBuscados.length === 1 ? 'accesorio' : 'accesorios'} para «${termino}»`}
        </p>
      </div>

      {sinResultados && (
        <div className="mb-10 border-2 border-tinta bg-papel p-6">
          <p className="font-display text-3xl font-bold uppercase leading-none">Sin resultados para «{termino}»</p>
          <ul className="mt-4 space-y-2 text-base">
            {hayConCorreccion && (
              <li>
                ¿Quisiste decir{' '}
                <button type="button" onClick={() => setConsulta(correccion)} className="font-bold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                  {correccion}
                </button>
                ?
              </li>
            )}
            {enOtroGenero && (
              <li>
                Hay resultados en el otro género.{' '}
                <button type="button" onClick={() => elegirVista('ambos')} className="font-bold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                  Ver ambos
                </button>
              </li>
            )}
            <li>
              <Link href={`/?q=${encodeURIComponent(termino)}`} className="font-bold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                Buscarlo en todas las zonas
              </Link>
            </li>
            <li>
              ¿No lo tenemos?{' '}
              <Link href={`/sugerencias?nombre=${encodeURIComponent(termino)}&zona=${encodeURIComponent(categoria.slug)}`} className="font-bold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                Sugiérenos este producto
              </Link>
            </li>
          </ul>
        </div>
      )}

      {!termino && <Complementos familias={familias} accesorios={accesorios} categoria={zona} />}

      <div className="space-y-16">
        {productos.length === 0 && (
          <p className="border-2 border-tinta bg-papel p-8 text-acero">Esta zona todavía no tiene prendas publicadas.</p>
        )}

        {productos.length > 0 && visibles.length === 0 && !termino && (
          <p className="border-2 border-tinta bg-papel p-8 text-acero">
            No hay prendas para este filtro en esta zona.{' '}
            <button
              type="button"
              onClick={() => elegirVista('ambos')}
              className="font-semibold text-tinta underline underline-offset-4 hover:bg-tinta hover:text-papel"
            >
              Ver ambos
            </button>
          </p>
        )}

        {grupos.map((g, i) => (
          <section key={g.etiqueta} id={`grupo-${i}`} aria-labelledby={`titulo-grupo-${i}`} className="scroll-mt-44 sm:scroll-mt-36">
            <Encabezado
              id={`titulo-grupo-${i}`}
              titulo={g.etiqueta}
              cantidad={g.familias.length}
              texto={
                i === 0
                  ? hayPares && vista === 'ambos'
                    ? 'Elige la talla de cada prenda e indica cuántas unidades necesitas. Si una prenda tiene versión de mujer y de hombre, aparecen juntas y puedes pedir las dos a la vez.'
                    : 'Elige la talla de cada prenda e indica cuántas unidades necesitas. Puedes pedir la misma prenda en varias tallas.'
                  : undefined
              }
            />
            <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {g.familias.map((familia) => (
                <SizeSelector key={familia.clave} familia={familia} categoria={zona} />
              ))}
            </div>
          </section>
        ))}

        {(!termino || accesoriosBuscados.length > 0) && (
        <section id="accesorios" aria-labelledby="titulo-accesorios" className="scroll-mt-44 sm:scroll-mt-36">
          <Encabezado
            id="titulo-accesorios"
            titulo="Accesorios"
            cantidad={accesoriosBuscados.length}
            texto={`Complementos propios de ${categoria.nombre}. No dependen del género. Búscalos por nombre, ordénalos por precio y agrégalos en la cantidad que necesites; si uno lleva talla, la eliges en su fila.`}
          />
          <AccessoriesSelector accesorios={accesorios} categoria={zona} tallas={tallas} consulta={consulta} />
        </section>
        )}
      </div>
    </div>
  );
}
