// app/page.js
import { obtenerCategorias } from '@/lib/queries';
import CategoryCard from '@/components/CategoryCard';
import { BadgeCheck, Ruler, Package } from 'lucide-react';

export default async function HomePage() {
  const categorias = await obtenerCategorias();

  return (
    <div>
      {/* Hero: degradado slate con un resplandor ámbar decorativo (solo CSS,
          sin depender de ninguna imagen externa) */}
      <section className="relative mb-14 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-8 py-16 text-white sm:px-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
            <BadgeCheck className="h-3.5 w-3.5" />
            {categorias.length} áreas de trabajo disponibles
          </span>

          <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Dotación profesional para cada industria
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Uniformes de calidad, tallas completas y accesorios especializados.
            Elige el área de tu equipo y arma su dotación en minutos.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-amber-400" /> Tallas completas por prenda
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-amber-400" /> Accesorios especializados por área
            </span>
          </div>
        </div>
      </section>

      <div className="mb-8">
        <h3 className="mb-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span className="h-6 w-1.5 rounded-full bg-amber-600" />
          Elige tu área de trabajo
        </h3>
        <p className="text-slate-600">
          Selecciona la industria de tu equipo para personalizar su dotación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categorias.map((categoria) => (
          <CategoryCard key={categoria.id} categoria={categoria} />
        ))}
      </div>
    </div>
  );
}
