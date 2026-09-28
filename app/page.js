// app/page.js
import { obtenerCategorias } from '@/lib/queries';
import CategoryCard from '@/components/CategoryCard';

export default async function HomePage() {
  const categorias = await obtenerCategorias();

  return (
    <div>
      <section className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-16 text-white sm:px-12">
        <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Dotación profesional para cada industria
        </h2>
        <p className="mt-4 max-w-xl text-blue-100">
          Uniformes de calidad, tallas completas y accesorios especializados.
          Elige el área de tu equipo y arma su dotación en minutos.
        </p>
      </section>

      <h3 className="mb-2 text-2xl font-bold">Elige tu área de trabajo</h3>
      <p className="mb-8 text-gray-600">
        Selecciona la industria de tu equipo para personalizar su dotación.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categorias.map((categoria) => (
          <CategoryCard key={categoria.id} categoria={categoria} />
        ))}
      </div>
    </div>
  );
}