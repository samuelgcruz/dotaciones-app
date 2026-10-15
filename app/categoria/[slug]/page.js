// app/categoria/[slug]/page.js
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { obtenerCategoriaConDetalle, obtenerCategorias } from '@/lib/queries';
import CategoriaClient from './CategoriaClient';

export default async function CategoriaPage({ params }) {
  const { slug } = await params;

  const [{ categoria, productos, accesorios }, categorias] = await Promise.all([
    obtenerCategoriaConDetalle(slug),
    obtenerCategorias(),
  ]);

  const posicion = categorias.findIndex((c) => c.id === categoria.id);
  const numero = String(posicion + 1).padStart(2, '0');

  return (
    <div className="mx-auto max-w-[88rem] px-4 pt-6 sm:px-8 sm:pt-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        Todas las zonas
      </Link>

      {/* Riel de zonas: se puede saltar de una a otra sin perder el pedido */}
      <nav aria-label="Zonas de trabajo" className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2">
          {categorias.map((c, i) => {
            const actual = c.id === categoria.id;
            return (
              <li key={c.id}>
                <Link
                  href={`/categoria/${c.slug}`}
                  aria-current={actual ? 'page' : undefined}
                  className={`flex items-stretch border-2 border-tinta transition-colors ${
                    actual ? 'bg-seguridad' : 'bg-papel hover:bg-white'
                  }`}
                >
                  <span className="grid w-9 place-items-center bg-tinta font-display text-lg font-bold text-seguridad tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="self-center px-3 py-2 font-display text-lg font-semibold uppercase leading-none">
                    {c.nombre}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <header className="mb-12 mt-8 flex flex-wrap items-end gap-x-8 gap-y-5 border-b-2 border-tinta pb-8">
        <span className="grid h-16 w-16 shrink-0 place-items-center border-2 border-tinta bg-seguridad font-display text-4xl font-extrabold leading-none tabular-nums sm:h-24 sm:w-24 sm:text-6xl lg:h-32 lg:w-32 lg:text-7xl">
          {numero}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words font-display text-[clamp(2.5rem,8vw,6.5rem)] font-extrabold uppercase leading-[0.85] tracking-tight">
            {categoria.nombre}
          </h2>
          {categoria.descripcion && (
            <p className="mt-4 max-w-2xl text-lg leading-snug text-acero">{categoria.descripcion}</p>
          )}
        </div>
      </header>

      <CategoriaClient categoria={categoria} productos={productos} accesorios={accesorios} />
    </div>
  );
}
