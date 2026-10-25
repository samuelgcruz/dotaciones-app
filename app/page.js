// app/page.js
import { obtenerCategorias, obtenerCatalogoCompleto } from '@/lib/queries';
import Link from 'next/link';
import { Lightbulb, Ruler, ClipboardList } from 'lucide-react';
import BuscadorGlobal from '@/components/BuscadorGlobal';
import CategoryCard from '@/components/CategoryCard';
import { construirIndiceBusqueda } from '@/lib/catalogo';
import { construirZonas } from '@/lib/solicitud';

const PASOS = [
  { titulo: 'Elige la zona', texto: 'Cada zona de trabajo tiene sus propias prendas y accesorios.' },
  { titulo: 'Define cantidades', texto: 'Suma unidades por talla, tantas como necesite tu equipo.' },
  { titulo: 'Envía el pedido', texto: 'Revisa el resumen, deja tus datos de contacto y te escribimos.' },
];

const HERRAMIENTAS = [
  { href: '/guia-tallas', icono: Ruler, titulo: 'Guía de tallas', texto: 'Calculadora de talla, equivalencias por país y cómo medirte.' },
  { href: '/sugerencias', icono: Lightbulb, titulo: 'Sugerir un producto', texto: '¿Echas de menos una prenda o un accesorio? Cuéntanos y lo evaluamos.' },
  { href: '/solicitud', icono: ClipboardList, titulo: 'Solicitud especial', texto: 'Grandes volúmenes, equipos completos o algo a la medida.' },
];

export default async function HomePage({ searchParams }) {
  const { q = '' } = await searchParams;
  const [categorias, catalogo] = await Promise.all([
    obtenerCategorias(),
    // Si el catálogo completo falla, la página sigue funcionando sin el buscador
    obtenerCatalogoCompleto().catch((error) => {
      console.error('No se pudo armar el índice de búsqueda:', error);
      return null;
    }),
  ]);
  const indice = catalogo ? construirIndiceBusqueda(construirZonas(catalogo)) : [];

  return (
    <div>
      <section className="mx-auto max-w-[88rem] px-4 pt-10 sm:px-8 sm:pt-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-end">
          <h1 className="text-balance font-display text-[clamp(3rem,7.5vw,7rem)] font-extrabold uppercase leading-[0.85] tracking-tight">
            Dotación para cada zona de trabajo
          </h1>
          <p className="max-w-sm text-lg leading-snug text-acero">
            Elige el área de tu equipo, indica cuántas unidades necesitas de cada talla y envía el
            pedido.
          </p>
        </div>
      </section>

      {indice.length > 0 && (
        <section aria-label="Buscar en el catálogo" className="mx-auto max-w-[88rem] px-4 pt-8 sm:px-8">
          <div className="max-w-3xl">
            <BuscadorGlobal indice={indice} consultaInicial={String(q).slice(0, 80)} />
          </div>
        </section>
      )}

      <section aria-labelledby="zonas" className="mx-auto max-w-[88rem] px-4 pt-10 sm:px-8 sm:pt-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="zonas" className="font-display text-3xl font-bold uppercase leading-none">
            Zonas de trabajo
          </h2>
          <p className="text-sm text-acero">
            {categorias.length} {categorias.length === 1 ? 'zona disponible' : 'zonas disponibles'}
          </p>
        </div>

        {categorias.length === 0 ? (
          <p className="border-2 border-tinta bg-papel p-8 text-acero">
            Todavía no hay zonas de trabajo publicadas.
          </p>
        ) : (
          <div className="flex flex-col border-2 border-tinta bg-tinta lg:h-[34rem] lg:flex-row">
            {categorias.map((categoria, i) => (
              <CategoryCard key={categoria.id} categoria={categoria} indice={i} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="herramientas" className="mx-auto max-w-[88rem] px-4 pt-16 sm:px-8">
        <h2 id="herramientas" className="mb-4 font-display text-3xl font-bold uppercase leading-none">
          Herramientas
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {HERRAMIENTAS.map(({ href, icono: Icono, titulo, texto }) => (
            <li key={href}>
              <Link href={href} className="group flex h-full flex-col gap-2 border-2 border-tinta bg-papel p-5 transition-colors hover:bg-seguridad">
                <Icono className="h-7 w-7" strokeWidth={2.25} aria-hidden="true" />
                <span className="font-display text-2xl font-bold uppercase leading-none">{titulo}</span>
                <span className="text-sm text-acero group-hover:text-tinta">{texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="volumen" className="zona-oscura mt-16 bg-grafito text-papel">
        <div className="mx-auto grid max-w-[88rem] gap-6 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 id="volumen" className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
              ¿Necesitas cientos de unidades?
            </h2>
            <p className="mt-3 max-w-2xl text-concreto">
              Si tu pedido supera el stock del catálogo o necesitas algo a la medida, envíanos la lista
              de artículos y cantidades como solicitud especial.
            </p>
          </div>
          <Link
            href="/solicitud"
            className="inline-block bg-seguridad px-8 py-4 text-center font-display text-2xl font-semibold uppercase tracking-wide text-tinta transition-colors hover:bg-papel"
          >
            Hacer una solicitud especial
          </Link>
        </div>
      </section>

      <section aria-labelledby="como-se-pide" className="mx-auto max-w-[88rem] px-4 pt-16 sm:px-8">
        <h2 id="como-se-pide" className="mb-10 font-display text-3xl font-bold uppercase leading-none">
          Cómo se pide
        </h2>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {PASOS.map((paso, i) => (
            <li
              key={paso.titulo}
              className="relative border-l-4 border-tinta pb-1 pl-8 md:border-l-0 md:border-t-4 md:pl-0 md:pt-8"
            >
              <span className="absolute -left-[18px] top-0 grid h-9 w-9 place-items-center border-2 border-tinta bg-seguridad font-display text-xl font-bold tabular-nums md:-top-[18px] md:left-0">
                {i + 1}
              </span>
              <h3 className="font-display text-2xl font-bold uppercase leading-none">{paso.titulo}</h3>
              <p className="mt-2 max-w-xs text-acero">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
