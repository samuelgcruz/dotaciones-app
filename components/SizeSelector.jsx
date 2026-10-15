// components/SizeSelector.jsx
// Una prenda como renglón de planilla: foto a la izquierda y, a la derecha,
// una celda por talla con su stock real y su propio control de cantidad.
// Cada celda escribe directo en el carrito, así que la misma prenda se puede
// pedir en varias tallas y en cualquier cantidad dentro de un mismo pedido.
'use client';

import Image from 'next/image';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { formatoPrecio } from '@/lib/formato';
import CantidadStepper from './CantidadStepper';

const STOCK_BAJO = 3;

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

export default function SizeSelector({ producto, categoria }) {
  const { lineas, cantidadDe, ajustarLinea } = useCarrito();

  const tallas = [...producto.producto_tallas].sort(compararTallas);
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

  return (
    <article className="grid border-2 border-tinta bg-papel md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="border-b-2 border-tinta p-4 md:border-b-0 md:border-r-2">
        <div className="marcas relative aspect-[4/3] bg-concreto-oscuro md:aspect-square">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-acero">Sin imagen</div>
          )}
        </div>
      </div>

      <div className="flex flex-col p-4 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
          <div>
            <h4 className="font-display text-3xl font-bold uppercase leading-none">{producto.nombre}</h4>
            <p className="mt-1 text-sm capitalize text-acero">{producto.tipo_prenda}</p>
          </div>
          <p className="font-display text-3xl font-semibold leading-none tabular-nums">
            {formatoPrecio(precio)}
            <span className="ml-1.5 font-sans text-sm font-normal text-acero">c/u</span>
          </p>
        </header>

        {tallas.length === 0 ? (
          <p className="mt-5 text-sm text-acero">Esta prenda aún no tiene tallas cargadas.</p>
        ) : (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-2.5">
            {tallas.map((pt) => {
              const base = lineaBase(pt);
              const cantidad = cantidadDe(base.key);
              const agotada = pt.stock <= 0;
              const bajo = !agotada && pt.stock <= STOCK_BAJO;
              const activa = cantidad > 0;

              return (
                <div
                  key={pt.id}
                  className={`flex flex-col border-2 ${
                    activa
                      ? 'border-tinta bg-seguridad'
                      : agotada
                        ? 'border-concreto-oscuro bg-concreto/60 text-acero'
                        : 'border-tinta/40 bg-white'
                  }`}
                >
                  <div className="px-2.5 pb-2 pt-1.5">
                    <p
                      className={`font-display text-3xl font-bold leading-none ${
                        agotada ? 'line-through decoration-2' : ''
                      }`}
                    >
                      {pt.tallas.nombre}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        activa ? 'text-tinta' : bajo ? 'font-semibold text-alerta' : 'text-acero'
                      }`}
                    >
                      {agotada ? 'Agotada' : bajo ? `Quedan ${pt.stock}` : `${pt.stock} disponibles`}
                    </p>
                  </div>

                  <CantidadStepper
                    variante="embebido"
                    compacto
                    cantidad={cantidad}
                    etiqueta={`${producto.nombre}, talla ${pt.tallas.nombre}`}
                    puedeSumar={!agotada && cantidad < Math.min(pt.stock, 99)}
                    onMenos={() => ajustarLinea(base, -1)}
                    onMas={() => ajustarLinea(base, 1)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {unidadesEnPedido > 0 && (
          <p className="mt-4 border-t-2 border-dashed border-tinta/30 pt-3 text-sm">
            En tu pedido:{' '}
            <strong className="font-semibold">
              {unidadesEnPedido} {unidadesEnPedido === 1 ? 'unidad' : 'unidades'}
            </strong>{' '}
            de esta prenda, {formatoPrecio(unidadesEnPedido * precio)}.
          </p>
        )}
      </div>
    </article>
  );
}
