// components/CategoryCard.jsx
// Tarjeta de categoría con imagen de fondo, overlay degradado y animación
// al pasar el mouse. Usa next/image para optimización automática.
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CategoryCard({ categoria }) {
  return (
    <Link
      href={`/categoria/${categoria.slug}`}
      className="group relative block h-64 overflow-hidden rounded-2xl shadow-md transition-shadow duration-300 hover:shadow-2xl"
    >
      {categoria.icono_url ? (
        <Image
          src={categoria.icono_url}
          alt={categoria.nombre}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="h-full w-full bg-blue-100" />
      )}

      {/* Overlay oscuro para que el texto blanco siempre sea legible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-xl font-bold drop-shadow-sm">{categoria.nombre}</h3>
        <p className="mt-1 text-sm text-gray-200 line-clamp-2">{categoria.descripcion}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
          Ver catálogo <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
