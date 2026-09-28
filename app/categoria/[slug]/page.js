// app/categoria/[slug]/page.js
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { obtenerCategoriaConDetalle } from '@/lib/queries';
import CategoriaClient from './CategoriaClient';

export default async function CategoriaPage({ params }) {
  const resolvedParams = await params;
  const { categoria, productos, accesorios } = await obtenerCategoriaConDetalle(resolvedParams.slug);

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <h2 className="text-2xl font-bold mb-1">{categoria.nombre}</h2>
      <p className="text-gray-600 mb-8">{categoria.descripcion}</p>

      <CategoriaClient categoria={categoria} productos={productos} accesorios={accesorios} />
    </div>
  );
}