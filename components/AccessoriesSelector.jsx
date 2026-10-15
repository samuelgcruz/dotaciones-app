// components/AccessoriesSelector.jsx
// Accesorios de la zona. Cada uno se puede pedir en la cantidad que haga falta:
// el botón "Agregar" se convierte en un control de cantidad.
'use client';

import Image from 'next/image';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { formatoPrecio } from '@/lib/formato';
import CantidadStepper from './CantidadStepper';

export default function AccessoriesSelector({ accesorios, categoria }) {
  const { cantidadDe, ajustarLinea } = useCarrito();

  if (!accesorios || accesorios.length === 0) {
    return <p className="text-acero">Esta zona no tiene accesorios adicionales.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          stock: 99, // los accesorios no manejan stock en la BD
          imagen_url: accesorio.imagen_url,
          categoriaId: categoria.id,
          categoriaNombre: categoria.nombre,
          categoriaSlug: categoria.slug,
        };
        const cantidad = cantidadDe(base.key);

        return (
          <article
            key={accesorio.id}
            className={`flex border-2 border-tinta ${cantidad > 0 ? 'bg-seguridad' : 'bg-papel'}`}
          >
            <div className="relative w-28 shrink-0 border-r-2 border-tinta bg-concreto-oscuro">
              {accesorio.imagen_url && (
                <Image
                  src={accesorio.imagen_url}
                  alt={accesorio.nombre}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3">
              <div>
                <h4 className="font-display text-xl font-bold uppercase leading-tight">{accesorio.nombre}</h4>
                <p className="font-display text-xl font-semibold tabular-nums">{formatoPrecio(precio)}</p>
              </div>

              <CantidadStepper
                compacto
                cantidad={cantidad}
                etiqueta={accesorio.nombre}
                etiquetaAgregar="Agregar"
                puedeSumar={cantidad < 99}
                onMenos={() => ajustarLinea(base, -1)}
                onMas={() => ajustarLinea(base, 1)}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
