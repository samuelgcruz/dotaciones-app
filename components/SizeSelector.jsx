// components/SizeSelector.jsx
// Ficha de prenda. Dos pasos claros:
//   1. Elegir la talla (cada talla muestra su stock en palabras y lo que ya pediste).
//   2. Indicar la cantidad de esa talla: se puede escribir el número exacto,
//      sumar o restar de a 1, 5 o 10, o quitarlas todas.
// La misma prenda se puede pedir en varias tallas; todo va directo al carrito.
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { hrefSolicitud } from '@/lib/contacto';
import { compararNombresTalla, etiquetaTipo, formatoPrecio } from '@/lib/formato';
import ControlCantidad from './ControlCantidad';

const STOCK_BAJO = 3;
const TOPE_POR_LINEA = 99;

export default function SizeSelector({ producto, categoria }) {
  const { lineas, cantidadDe, ajustarLinea } = useCarrito();

  const tallas = [...producto.producto_tallas].sort((a, b) =>
    compararNombresTalla(a.tallas.nombre, b.tallas.nombre)
  );
  const [activaId, setActivaId] = useState(() => (tallas.find((t) => t.stock > 0) ?? tallas[0])?.tallas.id ?? null);

  const precio = Number(producto.precio_base);
  const enPedido = lineas.filter((l) => l.tipo === 'producto' && l.id === producto.id);
  const unidadesEnPedido = enPedido.reduce((acc, l) => acc + l.cantidad, 0);

  function lineaBase(pt) {
    return {
      key: claveLinea('producto', producto.id, pt.tallas.id),
      tipo: 'producto',
      id: producto.id,
      tallaId: pt.tallas.id,
      tallaNombre: pt.tallas.nombre,
      nombre: producto.nombre,
      precio,
      stock: pt.stock,
      imagen_url: producto.imagen_url,
      categoriaId: categoria.id,
      categoriaNombre: categoria.nombre,
      categoriaSlug: categoria.slug,
    };
  }

  const activa = tallas.find((t) => t.tallas.id === activaId) ?? null;
  const base = activa ? lineaBase(activa) : null;
  const cantidadActiva = base ? cantidadDe(base.key) : 0;
  const agotada = activa ? activa.stock <= 0 : false;
  const tope = activa ? Math.min(activa.stock, TOPE_POR_LINEA) : 0;
  const enElTope = Boolean(activa) && !agotada && cantidadActiva >= tope;

  return (
    <article className="flex flex-col border-2 border-tinta bg-papel">
      <div className="relative aspect-[4/3] border-b-2 border-tinta bg-concreto-oscuro">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-acero">Sin imagen</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-acero">{etiquetaTipo(producto.tipo_prenda)}</p>
            <h4 className="font-display text-2xl font-bold uppercase leading-tight">{producto.nombre}</h4>
            {producto.descripcion && <p className="mt-1 line-clamp-2 text-sm text-acero">{producto.descripcion}</p>}
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-display text-3xl font-bold leading-none tabular-nums">
              {formatoPrecio(precio)}
            </span>
            <span className="text-xs text-acero">por unidad</span>
          </p>
        </header>

        {tallas.length === 0 ? (
          <p className="text-sm text-acero">Esta prenda aún no tiene tallas cargadas.</p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold">1. Elige la talla</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2">
                {tallas.map((pt) => {
                  const cant = cantidadDe(claveLinea('producto', producto.id, pt.tallas.id));
                  const esActiva = pt.tallas.id === activaId;
                  const sinStock = pt.stock <= 0;
                  const bajo = !sinStock && pt.stock <= STOCK_BAJO;
                  const textoStock = sinStock ? 'Agotada' : bajo ? `Quedan ${pt.stock}` : `Hay ${pt.stock}`;

                  return (
                    <button
                      key={pt.id}
                      type="button"
                      aria-pressed={esActiva}
                      aria-label={`Talla ${pt.tallas.nombre}: ${textoStock}${cant > 0 ? `, ${cant} en tu pedido` : ''}`}
                      onClick={() => setActivaId(pt.tallas.id)}
                      className={`flex flex-col items-center border-2 px-1 py-2 text-center transition-colors ${
                        esActiva
                          ? 'border-tinta bg-tinta text-papel'
                          : 'border-tinta/40 bg-white hover:border-tinta'
                      } ${sinStock && !esActiva ? 'bg-concreto/50 text-acero' : ''}`}
                    >
                      <span className="font-display text-3xl font-bold leading-none">{pt.tallas.nombre}</span>
                      <span
                        className={`mt-1 text-xs ${
                          esActiva ? 'text-concreto' : bajo ? 'font-semibold text-alerta' : 'text-acero'
                        }`}
                      >
                        {textoStock}
                      </span>
                      <span
                        className={`mt-1 min-h-4 px-1.5 text-xs font-semibold ${
                          cant > 0 ? 'bg-seguridad text-tinta' : ''
                        }`}
                      >
                        {cant > 0 ? `Pedido: ${cant}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-2 border-tinta bg-white p-3">
              {activa ? (
                <>
                  <p className="mb-3 text-sm font-semibold">
                    2. ¿Cuántas unidades de la talla {activa.tallas.nombre}?
                  </p>

                  {agotada ? (
                    <p className="text-sm">
                      Esta talla no tiene unidades ahora.{' '}
                      <Link
                        href={hrefSolicitud({
                          zonaSlug: categoria.slug,
                          productoId: producto.id,
                          tallaId: activa.tallas.id,
                        })}
                        className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel"
                      >
                        Pedirla en una solicitud especial
                      </Link>
                    </p>
                  ) : (
                    <>
                      <ControlCantidad
                        cantidad={cantidadActiva}
                        max={tope}
                        etiqueta={`${producto.nombre}, talla ${activa.tallas.nombre}`}
                        onCambiar={(n) => ajustarLinea(base, n - cantidadActiva)}
                      />
                      <p className="mt-3 text-xs text-acero">
                        Máximo por pedido en esta talla: {tope}.
                        {enElTope && (
                          <>
                            {' '}
                            <Link
                              href={hrefSolicitud({
                                zonaSlug: categoria.slug,
                                productoId: producto.id,
                                tallaId: activa.tallas.id,
                              })}
                              className="font-semibold text-tinta underline underline-offset-4 hover:bg-tinta hover:text-papel"
                            >
                              ¿Necesitas más? Haz una solicitud especial
                            </Link>
                          </>
                        )}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-acero">Elige una talla para indicar cuántas unidades necesitas.</p>
              )}
            </div>
          </>
        )}
      </div>

      {unidadesEnPedido > 0 && (
        <div className="border-t-2 border-tinta bg-seguridad px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              En tu pedido: {unidadesEnPedido} {unidadesEnPedido === 1 ? 'unidad' : 'unidades'}
            </span>
            <span className="font-display text-xl font-bold tabular-nums">
              {formatoPrecio(unidadesEnPedido * precio)}
            </span>
          </div>
          <p className="mt-0.5 text-xs">
            {[...enPedido]
              .sort((a, b) => compararNombresTalla(a.tallaNombre, b.tallaNombre))
              .map((l) => `talla ${l.tallaNombre}: ${l.cantidad}`)
              .join(', ')}
          </p>
        </div>
      )}
    </article>
  );
}
