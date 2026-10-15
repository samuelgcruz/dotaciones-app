// components/CategoryCard.jsx
// Un "casillero" de zona. En escritorio los casilleros se alinean en fila y el
// que recibe el foco se abre para mostrar la descripción; en móvil se apilan
// como filas. La placa amarilla lleva el número de la zona.
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CategoryCard({ categoria, indice }) {
  const numero = String(indice + 1).padStart(2, '0');

  return (
    <Link
      href={`/categoria/${categoria.slug}`}
      aria-label={`Zona ${numero}: ${categoria.nombre}`}
      className="group relative block min-h-52 overflow-hidden outline-offset-[-6px] focus-visible:outline-seguridad border-b-2 border-tinta bg-grafito text-papel last:border-b-0 lg:min-h-0 lg:min-w-[8.5rem] lg:flex-1 lg:border-b-0 lg:border-r-2 lg:transition-[flex-grow] lg:duration-500 lg:ease-out lg:last:border-r-0 lg:hover:flex-[2.4] lg:focus-visible:flex-[2.4]"
    >
      {categoria.icono_url ? (
        <Image
          src={categoria.icono_url}
          alt=""
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover grayscale contrast-125 transition duration-500 group-hover:scale-105 group-hover:grayscale-0 group-focus-visible:grayscale-0"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute -bottom-6 -right-2 font-display text-[14rem] font-extrabold leading-none text-papel/10"
        >
          {numero}
        </span>
      )}

      <div className="absolute inset-0 bg-tinta/40 transition-colors duration-500 group-hover:bg-tinta/10 group-focus-visible:bg-tinta/10" />

      {/* Placa numerada + ranuras de ventilación */}
      <span className="absolute left-0 top-0 bg-seguridad px-3 py-2 font-display text-3xl font-bold leading-none text-tinta tabular-nums">
        {numero}
      </span>
      <span aria-hidden="true" className="rejilla absolute right-4 top-4 hidden h-7 w-10 lg:block" />

      {/* Placa del nombre: fondo sólido para que siempre se lea */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-tinta p-4">
        <div className="min-w-0">
          <h3 className="hyphens-auto break-words font-display text-2xl font-bold uppercase leading-none sm:text-3xl">
            {categoria.nombre}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm text-concreto lg:line-clamp-3 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-20 lg:group-hover:opacity-100 lg:group-focus-visible:max-h-20 lg:group-focus-visible:opacity-100 [@media(hover:none)]:lg:max-h-20 [@media(hover:none)]:lg:opacity-100">
            {categoria.descripcion}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center bg-seguridad text-tinta transition-transform duration-300 group-hover:translate-x-1 lg:hidden lg:group-hover:grid lg:group-focus-visible:grid [@media(hover:none)]:lg:grid">
          <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
