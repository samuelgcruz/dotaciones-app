// app/categoria/[slug]/CategoriaClient.jsx
// Cuerpo de la zona. Las prendas se agrupan por tipo (camisas, pantalones...) y la barra
// fija acompaña el scroll, bajando y subiendo contigo: ahí está siempre a la vista el
// selector de género (solo afecta a las prendas) y los saltos a cada grupo y a los accesorios.
// Los accesorios son independientes del género. Todo va al carrito global (lib/carrito.js).
'use client';

import { useEffect, useMemo, useState } from 'react';
import SizeSelector from '@/components/SizeSelector';
import AccessoriesSelector from '@/components/AccessoriesSelector';
import { armarFamilias, filtrarFamilias, hayPrendasPorGenero, VISTAS } from '@/lib/catalogo';
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

export default function CategoriaClient({ categoria, productos, accesorios, tallas }) {
  const zona = { id: categoria.id, nombre: categoria.nombre, slug: categoria.slug };

  // Género elegido. Se recuerda al cambiar de zona; por defecto se ven ambos.
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

  // Grupos de prendas por tipo, en el orden en que aparecen
  const grupos = [];
  for (const f of visibles) {
    const etiqueta = etiquetaTipo(f.tipo);
    let grupo = grupos.find((g) => g.etiqueta === etiqueta);
    if (!grupo) {
      grupo = { etiqueta, familias: [] };
      grupos.push(grupo);
    }
    grupo.familias.push(f);
  }

  const hayPares = visibles.some((f) => f.variantes.length > 1);
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
              Accesorios ({accesorios.length})
            </a>
          </nav>
        </div>
      </div>

      <div className="space-y-16">
        {productos.length === 0 && (
          <p className="border-2 border-tinta bg-papel p-8 text-acero">Esta zona todavía no tiene prendas publicadas.</p>
        )}

        {productos.length > 0 && visibles.length === 0 && (
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

        <section id="accesorios" aria-labelledby="titulo-accesorios" className="scroll-mt-44 sm:scroll-mt-36">
          <Encabezado
            id="titulo-accesorios"
            titulo="Accesorios"
            cantidad={accesorios.length}
            texto={`Complementos propios de ${categoria.nombre}. No dependen del género. Búscalos por nombre, ordénalos por precio y agrégalos en la cantidad que necesites; si uno lleva talla, la eliges en su fila.`}
          />
          <AccessoriesSelector accesorios={accesorios} categoria={zona} tallas={tallas} />
        </section>
      </div>
    </div>
  );
}
