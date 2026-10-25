// app/sugerencias/page.js
// "Sugerir un producto": las empresas piden prendas o accesorios que el catálogo no tiene.
// Lee el catálogo para avisar si algo parecido ya existe; el guardado lo hace /api/sugerencias.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { construirIndiceBusqueda } from '@/lib/catalogo';
import { obtenerCatalogoCompleto } from '@/lib/queries';
import { construirZonas } from '@/lib/solicitud';
import SugerenciasClient from './SugerenciasClient';

export const metadata = {
  title: 'Sugerir un producto | Dotaciones y Uniformes',
  description: 'Cuéntanos qué prenda o accesorio echas de menos en el catálogo.',
};

export default async function SugerenciasPage({ searchParams }) {
  const { nombre = '', zona = '' } = await searchParams;
  const zonas = construirZonas(await obtenerCatalogoCompleto());

  return (
    <div className="mx-auto max-w-[88rem] px-4 pt-6 sm:px-8 sm:pt-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Volver al inicio
      </Link>

      <div className="mt-6 grid gap-6 border-b-2 border-tinta pb-8 lg:grid-cols-[1fr_24rem] lg:items-end">
        <h1 className="text-balance font-display text-[clamp(3rem,8vw,7rem)] font-extrabold uppercase leading-[0.85] tracking-tight">
          Sugerir un producto
        </h1>
        <p className="text-lg leading-snug text-acero">
          ¿Echas de menos una prenda o un accesorio? Cuéntanos qué necesitas y para qué zona. Revisamos cada sugerencia
          y decidimos si la agregamos al catálogo.
        </p>
      </div>

      <div className="py-8">
        <SugerenciasClient
          zonas={zonas.map((z) => ({ id: z.id, nombre: z.nombre, slug: z.slug }))}
          indice={construirIndiceBusqueda(zonas)}
          nombreInicial={String(nombre).slice(0, 120)}
          zonaSlugInicial={String(zona).slice(0, 80)}
        />
      </div>
    </div>
  );
}
