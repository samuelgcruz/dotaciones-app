// components/AccessoriesSelector.jsx
// Accesorios de la zona como fichas con foto. "Agregar" se convierte en el
// control de cantidad (con atajos +5 / +10) en cuanto hay al menos una unidad.
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { hrefSolicitud } from '@/lib/contacto';
import { formatoPrecio } from '@/lib/formato';
import ControlCantidad from './ControlCantidad';

const TOPE_POR_LINEA = 99;

export default function AccessoriesSelector({ accesorios, categoria }) {
  const { cantidadDe, ajustarLinea } = useCarrito();

  if (!accesorios || accesorios.length === 0) {
    return <p className="text-acero">Esta zona no tiene accesorios adicionales.</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {accesorios.map((accesorio) => {
        const precio = Number(accesorio.precio);
        const base = {
          key: claveLinea('accesorio', accesorio.id, null),
          tipo: 'accesorio',
          id: accesorio.id,
          tallaId: null,
          tallaNombre: null,
          nombre: accesorio.nombre,
          precio,
          stock: TOPE_POR_LINEA, // los accesorios no manejan stock en la BD
          imagen_url: accesorio.imagen_url,
          categoriaId: categoria.id,
          categoriaNombre: categoria.nombre,
          categoriaSlug: categoria.slug,
        };
        const cantidad = cantidadDe(base.key);

        return (
          <article key={accesorio.id} className="group flex flex-col border-2 border-tinta bg-papel">
            <div className="relative aspect-square overflow-hidden border-b-2 border-tinta bg-concreto-oscuro">
              {accesorio.imagen_url ? (
                <Image
                  src={accesorio.imagen_url}
                  alt={accesorio.nombre}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full place-items-center text-acero/50">
                  <Package className="h-12 w-12" strokeWidth={1.5} />
                </div>
              )}

              {cantidad > 0 && (
                <span className="absolute right-0 top-0 grid min-w-9 place-items-center border-b-2 border-l-2 border-tinta bg-seguridad px-2 py-1 font-display text-xl font-bold leading-none tabular-nums">
                  {cantidad}
                </span>
              )}

              <p className="absolute bottom-0 left-0 border-r-2 border-t-2 border-tinta bg-seguridad px-3 py-1.5 font-display text-2xl font-bold leading-none tabular-nums">
                {formatoPrecio(precio)}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3">
              <h4 className="font-display text-xl font-bold uppercase leading-tight">{accesorio.nombre}</h4>

              <div className="mt-auto">
                {cantidad === 0 ? (
                  <button
                    type="button"
                    onClick={() => ajustarLinea(base, 1)}
                    className="flex h-11 w-full items-center justify-center gap-2 border-2 border-tinta bg-tinta font-display text-lg font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-seguridad hover:text-tinta"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    Agregar
                  </button>
                ) : (
                  <ControlCantidad
                    cantidad={cantidad}
                    max={TOPE_POR_LINEA}
                    etiqueta={accesorio.nombre}
                    onCambiar={(n) => ajustarLinea(base, n - cantidad)}
                  />
                )}

                {cantidad >= TOPE_POR_LINEA && (
                  <p className="mt-2 text-sm">
                    Máximo por pedido.{' '}
                    <Link
                      href={hrefSolicitud(categoria.slug, accesorio.nombre)}
                      className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel"
                    >
                      Pedir más en una solicitud especial
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
