// components/SizeSelector.jsx
// Ficha de prenda: foto grande con la etiqueta de precio, fichas de talla con
// medidor de stock y un panel de cantidad para la talla elegida. Se puede pedir
// la misma prenda en varias tallas; todo va directo al carrito.
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { hrefSolicitud } from '@/lib/contacto';
import { formatoPrecio } from '@/lib/formato';
import ControlCantidad from './ControlCantidad';

const STOCK_BAJO = 3;
const TOPE_POR_LINEA = 99;

// Orden natural de tallas: XS, S, M, L, XL... y luego las numéricas (28, 30, 32...)
const ORDEN_LETRAS = { XXS: 0, XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, '2XL': 6, XXXL: 7, '3XL': 7, '4XL': 8 };

function llaveOrden(nombre) {
  const n = String(nombre).trim().toUpperCase();
  if (ORDEN_LETRAS[n] !== undefined) return [0, ORDEN_LETRAS[n], n];
  const numero = Number(n.replace(',', '.'));
  if (Number.isFinite(numero)) return [1, numero, n];
  return [2, 0, n];
}

function compararTallas(a, b) {
  const [ga, va, ta] = llaveOrden(a.tallas.nombre);
  const [gb, vb, tb] = llaveOrden(b.tallas.nombre);
  return ga - gb || va - vb || ta.localeCompare(tb);
}

// Medidor de stock de 4 segmentos (como un indicador de nivel)
function Nivel({ stock }) {
  const lleno = stock <= 0 ? 0 : stock >= 20 ? 4 : stock >= 10 ? 3 : stock >= 4 ? 2 : 1;
  const bajo = stock > 0 && stock <= STOCK_BAJO;
  return (
    <span aria-hidden="true" className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 ${i <= lleno ? (bajo ? 'bg-alerta' : 'bg-current') : 'bg-current/20'}`}
        />
      ))}
    </span>
  );
}

export default function SizeSelector({ producto, categoria }) {
  const { lineas, cantidadDe, ajustarLinea } = useCarrito();

  const tallas = [...producto.producto_tallas].sort(compararTallas);
  const [activaId, setActivaId] = useState(() => (tallas.find((t) => t.stock > 0) ?? tallas[0])?.tallas.id ?? null);

  const precio = Number(producto.precio_base);
  const unidadesEnPedido = lineas
    .filter((l) => l.tipo === 'producto' && l.id === producto.id)
    .reduce((acc, l) => acc + l.cantidad, 0);

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
  const bajo = activa ? !agotada && activa.stock <= STOCK_BAJO : false;
  const tope = activa ? Math.min(activa.stock, TOPE_POR_LINEA) : 0;
  const enElTope = activa && !agotada && cantidadActiva >= tope;

  return (
    <article className="group flex flex-col border-2 border-tinta bg-papel">
      {/* Foto con etiquetas */}
      <div className="relative aspect-[5/4] overflow-hidden border-b-2 border-tinta bg-concreto-oscuro">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-acero">Sin imagen</div>
        )}

        <span className="absolute left-0 top-0 bg-tinta px-3 py-1.5 text-sm font-semibold capitalize text-papel">
          {producto.tipo_prenda}
        </span>

        <p className="absolute bottom-0 left-0 border-r-2 border-t-2 border-tinta bg-seguridad px-3 py-1.5 font-display text-3xl font-bold leading-none tabular-nums">
          {formatoPrecio(precio)}
          <span className="ml-1.5 font-sans text-xs font-medium">c/u</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <h4 className="font-display text-2xl font-bold uppercase leading-none">{producto.nombre}</h4>

        {tallas.length === 0 ? (
          <p className="text-sm text-acero">Esta prenda aún no tiene tallas cargadas.</p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold">Talla</p>
              <div className="flex flex-wrap gap-x-2.5 gap-y-3">
                {tallas.map((pt) => {
                  const cant = cantidadDe(claveLinea('producto', producto.id, pt.tallas.id));
                  const esActiva = pt.tallas.id === activaId;
                  const sinStock = pt.stock <= 0;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      aria-pressed={esActiva}
                      aria-label={`Talla ${pt.tallas.nombre}, ${
                        sinStock ? 'agotada' : `${pt.stock} disponibles`
                      }${cant > 0 ? `, ${cant} en tu pedido` : ''}`}
                      onClick={() => setActivaId(pt.tallas.id)}
                      className={`relative flex h-16 w-16 flex-col justify-between border-2 p-1.5 text-left transition-colors ${
                        esActiva
                          ? 'border-tinta bg-tinta text-papel'
                          : sinStock
                            ? 'border-concreto-oscuro bg-concreto/40 text-acero hover:border-tinta'
                            : 'border-tinta/40 bg-white hover:border-tinta'
                      }`}
                    >
                      <span
                        className={`font-display text-2xl font-bold leading-none ${
                          sinStock ? 'line-through decoration-2' : ''
                        }`}
                      >
                        {pt.tallas.nombre}
                      </span>
                      <Nivel stock={pt.stock} />
                      {cant > 0 && (
                        <span className="absolute -right-2 -top-2 grid min-w-6 place-items-center border-2 border-tinta bg-seguridad px-1 font-display text-sm font-bold leading-5 tabular-nums text-tinta">
                          {cant}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel de cantidad de la talla elegida */}
            <div className="border-2 border-tinta bg-concreto/50 p-3">
              {activa ? (
                <>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <p className="font-display text-xl font-bold uppercase leading-none">
                      Talla {activa.tallas.nombre}
                    </p>
                    <p className={`text-sm ${bajo ? 'font-semibold text-alerta' : 'text-acero'}`}>
                      {agotada ? 'Agotada' : bajo ? `Quedan ${activa.stock}` : `${activa.stock} disponibles`}
                    </p>
                  </div>

                  {!agotada && (
                    <ControlCantidad
                      cantidad={cantidadActiva}
                      max={tope}
                      etiqueta={`${producto.nombre}, talla ${activa.tallas.nombre}`}
                      onCambiar={(n) => ajustarLinea(base, n - cantidadActiva)}
                    />
                  )}

                  {(agotada || enElTope) && (
                    <p className="mt-3 text-sm">
                      {agotada ? 'Esta talla no tiene unidades ahora. ' : 'Llegaste al máximo por pedido. '}
                      <Link
                        href={hrefSolicitud(
                          categoria.slug,
                          `${producto.nombre}, talla ${activa.tallas.nombre}`
                        )}
                        className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel"
                      >
                        Pedir más en una solicitud especial
                      </Link>
                    </p>
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
        <div className="flex items-center justify-between gap-3 border-t-2 border-tinta bg-seguridad px-4 py-2.5">
          <span className="text-sm font-semibold">
            {unidadesEnPedido} {unidadesEnPedido === 1 ? 'unidad' : 'unidades'} en tu pedido
          </span>
          <span className="font-display text-xl font-bold tabular-nums">
            {formatoPrecio(unidadesEnPedido * precio)}
          </span>
        </div>
      )}
    </article>
  );
}
