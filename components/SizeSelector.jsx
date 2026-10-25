// components/SizeSelector.jsx
// Ficha de prenda. Una ficha representa una "familia": una prenda con una o varias
// versiones (mujer / hombre / unisex). Cada versión tiene su propio stock, y se pide así:
//   1. Elegir la talla (cada talla muestra su stock en palabras y lo que ya pediste).
//   2. Indicar la cantidad de esa talla: escribir el número exacto, sumar o restar, o quitar todas.
// Si la ficha tiene las dos versiones (mujer y hombre) se muestran juntas, lado a lado, cada
// una con sus tallas y cantidades: así se piden, por ejemplo, 20 de mujer y 20 de hombre sin
// cambiar ningún filtro. Todo va directo al carrito.
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { claveLinea, useCarrito } from '@/lib/carrito';
import { hrefSolicitud } from '@/lib/contacto';
import { compararNombresTalla, ETIQUETA_GENERO, etiquetaTipo, formatoPrecio } from '@/lib/formato';
import BotonGuiaTallas from './BotonGuiaTallas';
import ControlCantidad from './ControlCantidad';

const STOCK_BAJO = 3;
const TOPE_POR_LINEA = 99;

// Etiqueta de para quién es la prenda. Las unisex dicen "Producto unisex".
function EtiquetaGenero({ genero, className = '' }) {
  const texto = genero === 'unisex' ? 'Producto unisex' : ETIQUETA_GENERO[genero];
  return (
    <span
      data-genero={genero}
      className={`inline-block border-2 border-tinta px-2 py-0.5 text-sm font-bold leading-tight ${
        genero === 'unisex' ? 'bg-white' : 'bg-seguridad'
      } ${className}`}
    >
      {texto}
    </span>
  );
}

function Imagen({ producto, sizes, className = '' }) {
  return producto.imagen_url ? (
    <Image src={producto.imagen_url} alt={producto.nombre} fill sizes={sizes} className={`object-cover ${className}`} />
  ) : (
    <div className="grid h-full place-items-center text-sm text-acero">Sin imagen</div>
  );
}

// Una versión de la prenda: sus tallas, su stock y su cantidad.
function PanelPrenda({ producto, categoria, compacto }) {
  const { cantidadDe, ajustarLinea } = useCarrito();

  const tallas = [...producto.producto_tallas].sort((a, b) =>
    compararNombresTalla(a.tallas.nombre, b.tallas.nombre)
  );
  const [activaId, setActivaId] = useState(
    () => (tallas.find((t) => t.stock > 0) ?? tallas[0])?.tallas.id ?? null
  );
  const precio = Number(producto.precio_base);

  function lineaBase(pt) {
    return {
      key: claveLinea('producto', producto.id, pt.tallas.id),
      tipo: 'producto',
      id: producto.id,
      tallaId: pt.tallas.id,
      tallaNombre: pt.tallas.nombre,
      genero: producto.genero,
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
  const generoTexto = producto.genero === 'unisex' ? '' : ` (${ETIQUETA_GENERO[producto.genero].toLowerCase()})`;

  const enlaceSolicitud = activa
    ? hrefSolicitud({ zonaSlug: categoria.slug, productoId: producto.id, tallaId: activa.tallas.id })
    : '/solicitud';

  return (
    <div className="flex min-w-0 flex-1 flex-col" data-panel-genero={producto.genero}>
      {!compacto && (
        <div className="relative aspect-[4/3] border-b-2 border-tinta bg-concreto-oscuro">
          <Imagen producto={producto} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          <EtiquetaGenero genero={producto.genero} className="absolute left-3 top-3" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-5 p-4">
        <header className="flex items-start gap-3">
          {compacto && (
            <div className="relative h-20 w-20 shrink-0 border-2 border-tinta bg-concreto-oscuro">
              <Imagen producto={producto} sizes="80px" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {compacto ? (
              <EtiquetaGenero genero={producto.genero} className="mb-1.5" />
            ) : (
              <p className="text-sm font-semibold text-acero">{etiquetaTipo(producto.tipo_prenda)}</p>
            )}
            <h4 className="font-display text-2xl font-bold uppercase leading-tight">{producto.nombre}</h4>
            {producto.descripcion && <p className="mt-1 line-clamp-2 text-sm text-acero">{producto.descripcion}</p>}
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-display text-3xl font-bold leading-none tabular-nums">{formatoPrecio(precio)}</span>
            <span className="text-xs text-acero">por unidad</span>
          </p>
        </header>

        {tallas.length === 0 ? (
          <p className="text-sm text-acero">Esta prenda aún no tiene tallas cargadas.</p>
        ) : (
          <>
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold">1. Elige la talla</p>
                <BotonGuiaTallas genero={producto.genero === 'hombre' ? 'hombre' : 'mujer'} />
              </div>
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
                      aria-label={`Talla ${pt.tallas.nombre}${generoTexto}: ${textoStock}${cant > 0 ? `, ${cant} en tu pedido` : ''}`}
                      onClick={() => setActivaId(pt.tallas.id)}
                      className={`flex flex-col items-center border-2 px-1 py-2 text-center transition-colors ${
                        esActiva ? 'border-tinta bg-tinta text-papel' : 'border-tinta/40 bg-white hover:border-tinta'
                      } ${sinStock && !esActiva ? 'bg-concreto/50 text-acero' : ''}`}
                    >
                      <span className="font-display text-3xl font-bold leading-none">{pt.tallas.nombre}</span>
                      <span className={`mt-1 text-xs ${esActiva ? 'text-concreto' : bajo ? 'font-semibold text-alerta' : 'text-acero'}`}>
                        {textoStock}
                      </span>
                      <span className={`mt-1 min-h-4 px-1.5 text-xs font-semibold ${cant > 0 ? 'bg-seguridad text-tinta' : ''}`}>
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
                  <p className="mb-3 text-sm font-semibold">2. ¿Cuántas unidades de la talla {activa.tallas.nombre}?</p>

                  {agotada ? (
                    <p className="text-sm">
                      Esta talla no tiene unidades ahora.{' '}
                      <Link href={enlaceSolicitud} className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                        Pedirla en una solicitud especial
                      </Link>
                    </p>
                  ) : (
                    <>
                      <ControlCantidad
                        cantidad={cantidadActiva}
                        max={tope}
                        etiqueta={`${producto.nombre}${generoTexto}, talla ${activa.tallas.nombre}`}
                        onCambiar={(n) => ajustarLinea(base, n - cantidadActiva)}
                      />
                      <p className="mt-3 text-xs text-acero">
                        Máximo por pedido en esta talla: {tope}.
                        {enElTope && (
                          <>
                            {' '}
                            <Link href={enlaceSolicitud} className="font-semibold text-tinta underline underline-offset-4 hover:bg-tinta hover:text-papel">
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
    </div>
  );
}

export default function SizeSelector({ familia, categoria }) {
  const { lineas } = useCarrito();
  const { variantes } = familia;
  const varias = variantes.length > 1;

  const ids = new Set(variantes.map((v) => v.id));
  const enPedido = lineas.filter((l) => l.tipo === 'producto' && ids.has(l.id));
  const unidades = enPedido.reduce((acc, l) => acc + l.cantidad, 0);
  const total = enPedido.reduce((acc, l) => acc + l.cantidad * l.precio, 0);

  const detalle = [...enPedido]
    .sort(
      (a, b) =>
        variantes.findIndex((v) => v.id === a.id) - variantes.findIndex((v) => v.id === b.id) ||
        compararNombresTalla(a.tallaNombre, b.tallaNombre)
    )
    .map((l) => {
      const genero = varias && l.genero && l.genero !== 'unisex' ? `${ETIQUETA_GENERO[l.genero]}, ` : '';
      return `${genero}talla ${l.tallaNombre}: ${l.cantidad}`;
    })
    .join(' · ');

  return (
    <article
      data-familia={familia.clave}
      className={`flex flex-col border-2 border-tinta bg-papel ${varias ? 'sm:col-span-2 lg:col-span-3' : ''}`}
    >
      {varias && (
        <div className="border-b-2 border-tinta bg-grafito px-4 py-2 text-papel">
          <p className="text-sm font-semibold">
            {etiquetaTipo(familia.tipo)}: cada versión tiene sus propias tallas y cantidades
          </p>
        </div>
      )}

      <div className={varias ? 'grid divide-tinta md:grid-cols-2 md:divide-x-2 max-md:divide-y-2' : 'flex'}>
        {variantes.map((v) => (
          <PanelPrenda key={v.id} producto={v} categoria={categoria} compacto={varias} />
        ))}
      </div>

      {unidades > 0 && (
        <div className="border-t-2 border-tinta bg-seguridad px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              En tu pedido: {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
            </span>
            <span className="font-display text-xl font-bold tabular-nums">{formatoPrecio(total)}</span>
          </div>
          <p className="mt-0.5 text-xs">{detalle}</p>
        </div>
      )}
    </article>
  );
}
