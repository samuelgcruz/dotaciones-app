// components/AccessoriesSelector.jsx
// Accesorios de la zona como lista de pedido: miniatura, nombre y descripción,
// precio y cantidad en una misma fila. Se filtra con el buscador de la zona (prop `consulta`,
// búsqueda inteligente de lib/busqueda.js) y tiene orden y un filtro para ver solo los
// que ya están en el pedido.
// Los accesorios son independientes del género: no se filtran por Mujer/Hombre. Solo los
// que están marcados con requiere_talla (por ejemplo unos guantes) piden elegir una talla;
// los demás se agregan directo.
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { buscar } from '@/lib/busqueda';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { textoBuscable } from '@/lib/catalogo';
import { hrefSolicitud } from '@/lib/contacto';
import { compararNombresTalla, formatoPrecio } from '@/lib/formato';
import ControlCantidad from './ControlCantidad';

const TOPE_POR_LINEA = 99;

const ORDENES = {
  nombre: { etiqueta: 'Nombre (A a Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
  menor: { etiqueta: 'Precio: menor a mayor', comparar: (a, b) => Number(a.precio) - Number(b.precio) },
  mayor: { etiqueta: 'Precio: mayor a menor', comparar: (a, b) => Number(b.precio) - Number(a.precio) },
};

export default function AccessoriesSelector({ accesorios, categoria, tallas = [], consulta = '' }) {
  const { lineas, cantidadDe, ajustarLinea } = useCarrito();
  const [tallaElegida, setTallaElegida] = useState({}); // accesorioId → tallaId
  const tallasOrdenadas = [...tallas].sort((a, b) => compararNombresTalla(a.nombre, b.nombre));
  const [orden, setOrden] = useState('nombre');
  const [soloAgregados, setSoloAgregados] = useState(false);

  if (!accesorios || accesorios.length === 0) {
    return <p className="text-acero">Esta zona no tiene accesorios adicionales.</p>;
  }

  // Unidades de un accesorio sumando todas sus tallas (si no lleva talla, es una sola línea)
  const unidadesDe = (a) =>
    lineas.filter((l) => l.tipo === 'accesorio' && l.id === a.id).reduce((acc, l) => acc + l.cantidad, 0);
  const agregados = accesorios.filter((a) => unidadesDe(a) > 0).length;

  const termino = consulta.trim();
  const porNombre = ORDENES[orden].comparar;
  const visibles = buscar(
    accesorios,
    termino,
    (a) => textoBuscable({ nombre: a.nombre, descripcion: a.descripcion, tipo: 'accesorio' })
  )
    .map((r) => r.item)
    .filter((a) => !soloAgregados || unidadesDe(a) > 0)
    .sort(porNombre);

  return (
    <div>
      {/* Herramientas de la lista */}
      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-3">
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
            : `Ningún accesorio coincide con «${termino}».`}
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
              const llevaTalla = Boolean(accesorio.requiere_talla);
              const tallaId = llevaTalla ? tallaElegida[accesorio.id] ?? '' : null;
              const tallaNombre = llevaTalla ? tallasOrdenadas.find((t) => t.id === tallaId)?.nombre ?? null : null;
              const base = {
                key: claveLinea('accesorio', accesorio.id, tallaId || null),
                tipo: 'accesorio',
                id: accesorio.id,
                tallaId: tallaId || null,
                tallaNombre,
                nombre: accesorio.nombre,
                precio,
                stock: TOPE_POR_LINEA, // los accesorios no manejan stock en la BD
                imagen_url: accesorio.imagen_url,
                categoriaId: categoria.id,
                categoriaNombre: categoria.nombre,
                categoriaSlug: categoria.slug,
              };
              const cantidad = cantidadDe(base.key);
              const unidades = unidadesDe(accesorio);
              const etiqueta = tallaNombre ? `${accesorio.nombre}, talla ${tallaNombre}` : accesorio.nombre;
              const porTalla = llevaTalla
                ? lineas
                    .filter((l) => l.tipo === 'accesorio' && l.id === accesorio.id)
                    .sort((a, b) => compararNombresTalla(a.tallaNombre ?? '', b.tallaNombre ?? ''))
                    .map((l) => `talla ${l.tallaNombre}: ${l.cantidad}`)
                    .join(' · ')
                : '';

              return (
                <li
                  key={accesorio.id}
                  id={`acc-${accesorio.id}`}
                  className={`scroll-mt-44 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 p-3 md:grid-cols-[4.5rem_minmax(0,1fr)_7rem_17rem] md:items-start ${
                    unidades > 0 ? 'bg-seguridad/25' : ''
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
                    {porTalla && <p className="mt-1 text-sm font-semibold">En tu pedido: {porTalla}</p>}
                    <p className="mt-1 font-display text-xl font-semibold tabular-nums md:hidden">
                      {formatoPrecio(precio)} <span className="font-sans text-xs font-normal text-acero">por unidad</span>
                    </p>
                  </div>

                  <p className="hidden font-display text-2xl font-semibold leading-none tabular-nums md:block">
                    {formatoPrecio(precio)}
                  </p>

                  <div className="col-span-2 md:col-span-1">
                    {llevaTalla && (
                      <div className="mb-2">
                        <label htmlFor={`talla-${accesorio.id}`} className="mb-1 block text-xs font-semibold text-acero">
                          Talla de este accesorio
                        </label>
                        <select
                          id={`talla-${accesorio.id}`}
                          value={tallaId ?? ''}
                          onChange={(e) => setTallaElegida((prev) => ({ ...prev, [accesorio.id]: e.target.value }))}
                          disabled={tallasOrdenadas.length === 0}
                          className="w-full border-2 border-tinta bg-white px-3 py-2 text-base"
                        >
                          <option value="">{tallasOrdenadas.length === 0 ? 'Sin tallas cargadas' : 'Elige una talla'}</option>
                          {tallasOrdenadas.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {llevaTalla && !tallaId ? (
                      <p className="border-2 border-dashed border-tinta/40 px-3 py-2.5 text-sm text-acero">
                        Elige una talla para indicar la cantidad.
                      </p>
                    ) : cantidad === 0 ? (
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
                          etiqueta={etiqueta}
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
