// components/CartBar.jsx
// Barra fija en la parte baja: aparece en cuanto hay algo en el pedido y lleva
// directo al resumen. Se oculta mientras el panel del pedido está abierto.
'use client';

import { useCarrito } from '@/lib/carrito';
import { formatoPrecio } from '@/lib/formato';

export default function CartBar() {
  const { unidades, total, zonas, abierto, abrirCarrito } = useCarrito();

  if (unidades === 0 || abierto) return null;

  return (
    <div className="entra-desde-abajo fixed inset-x-0 bottom-0 z-30 border-t-2 border-tinta bg-seguridad">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <p className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium">
            {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
            <span className="hidden sm:inline"> en tu pedido</span>
            {zonas.length > 1 ? `, ${zonas.length} zonas` : ''}
          </span>
          <span className="font-display text-3xl font-bold tabular-nums">{formatoPrecio(total)}</span>
        </p>

        <button
          type="button"
          onClick={abrirCarrito}
          className="shrink-0 whitespace-nowrap bg-tinta px-5 py-3 font-display text-xl font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-grafito"
        >
          Ver pedido
        </button>
      </div>
    </div>
  );
}
