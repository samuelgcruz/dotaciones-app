// components/AccessoriesSelector.jsx
// Accesorios de la zona como lista de pedido: miniatura, nombre y descripción,
// precio y cantidad en una misma fila. Incluye buscador, orden y un filtro para
// ver solo los que ya están en el pedido.
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus, Search } from 'lucide-react';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { hrefSolicitud } from '@/lib/contacto';
import { formatoPrecio } from '@/lib/formato';
import ControlCantidad from './ControlCantidad';

const TOPE_POR_LINEA = 99;

const ORDENES = {
  nombre: { etiqueta: 'Nombre (A a Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
  menor: { etiqueta: 'Precio: menor a mayor', comparar: (a, b) => Number(a.precio) - Number(b.precio) },
  mayor: { etiqueta: 'Precio: mayor a menor', comparar: (a, b) => Number(b.precio) - Number(a.precio) },
};

export default function AccessoriesSelector({ accesorios, categoria }) {
  const { cantidadDe, ajustarLinea } = useCarrito();
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [soloAgregados, setSoloAgregados] = useState(false);

  if (!accesorios || accesorios.length === 0) {
    return <p className="text-acero">Esta zona no tiene accesorios adicionales.</p>;
  }

  const claveDe = (a) => claveLinea('accesorio', a.id, null);
  const agregados = accesorios.filter((a) => cantidadDe(claveDe(a)) > 0).length;

  const termino = busqueda.trim().toLowerCase();
  const visibles = accesorios
    .filter((a) => !termino || `${a.nombre} ${a.descripcion ?? ''}`.toLowerCase().includes(termino))
    .filter((a) => !soloAgregados || cantidadDe(claveDe(a)) > 0)
    .sort(ORDENES[orden].comparar);

  return (
    <div>
      {/* Herramientas de la lista */}
      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor="buscar-accesorio" className="mb-1 block text-sm font-semibold">
            Buscar accesorio
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-acero" />
            <input
              id="buscar-accesorio"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escribe un nombre"
              className="w-full border-2 border-tinta bg-white py-2.5 pl-9 pr-3 text-base"
            />
          </div>
        </div>

        <div>
          <label htmlFor="orden-accesorios" className="mb-1 block text-sm font-semibold">
            Ordenar por
          </label>
          <select
            id="orden-accesorios"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="border-2 border-tinta bg-white px-3 py-2.5 text-base"
          >
            {Object.entries(ORDENES).map(([clave, o]) => (
              <option key={clave} value={clave}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 py-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={soloAgregados}
            onChange={(e) => setSoloAgregados(e.target.checked)}
            className="h-5 w-5 accent-tinta"
          />
          Solo los que ya agregué ({agregados})
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="border-2 border-tinta bg-papel p-6 text-acero">
          {soloAgregados && !termino
            ? 'Todavía no agregaste accesorios de esta zona.'
            : 'Ningún accesorio coincide con tu búsqueda.'}
        </p>
      ) : (
        <div className="border-2 border-tinta bg-papel">
          {/* Encabezado de columnas (solo en pantallas anchas) */}
          <div className="hidden grid-cols-[4.5rem_minmax(0,1fr)_7rem_17rem] gap-x-4 border-b-2 border-tinta bg-grafito px-3 py-2 text-sm font-semibold text-papel md:grid">
            <span className="col-span-2">Accesorio</span>
            <span>Precio</span>
            <span>Cantidad</span>
          </div>

          <ul className="divide-y-2 divide-tinta/15">
            {visibles.map((accesorio) => {
              const precio = Number(accesorio.precio);
              const base = {
                key: claveDe(accesorio),
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
                <li
                  key={accesorio.id}
                  className={`grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 p-3 md:grid-cols-[4.5rem_minmax(0,1fr)_7rem_17rem] md:items-start ${
                    cantidad > 0 ? 'bg-seguridad/25' : ''
                  }`}
                >
                  <div className="relative h-[4.5rem] w-[4.5rem] border-2 border-tinta bg-concreto-oscuro">
                    {accesorio.imagen_url ? (
                      <Image src={accesorio.imagen_url} alt="" fill sizes="72px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-acero/50">
                        <Package className="h-7 w-7" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-display text-xl font-bold uppercase leading-tight">{accesorio.nombre}</h4>
                    {accesorio.descripcion && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-acero">{accesorio.descripcion}</p>
                    )}
                    <p className="mt-1 font-display text-xl font-semibold tabular-nums md:hidden">
                      {formatoPrecio(precio)} <span className="font-sans text-xs font-normal text-acero">por unidad</span>
                    </p>
                  </div>

                  <p className="hidden font-display text-2xl font-semibold leading-none tabular-nums md:block">
                    {formatoPrecio(precio)}
                  </p>

                  <div className="col-span-2 md:col-span-1">
                    {cantidad === 0 ? (
                      <button
                        type="button"
                        onClick={() => ajustarLinea(base, 1)}
                        className="flex h-12 w-full items-center justify-center gap-2 border-2 border-tinta bg-tinta font-display text-lg font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-seguridad hover:text-tinta"
                      >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        Agregar al pedido
                      </button>
                    ) : (
                      <>
                        <ControlCantidad
                          cantidad={cantidad}
                          max={TOPE_POR_LINEA}
                          etiqueta={accesorio.nombre}
                          onCambiar={(n) => ajustarLinea(base, n - cantidad)}
                        />
                        {cantidad >= TOPE_POR_LINEA && (
                          <p className="mt-2 text-sm">
                            Máximo por pedido.{' '}
                            <Link
                              href={hrefSolicitud({ zonaSlug: categoria.slug, accesorioId: accesorio.id })}
                              className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel"
                            >
                              Pedir más en una solicitud especial
                            </Link>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
