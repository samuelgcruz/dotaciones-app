// components/CartButton.jsx
// Botón del pedido en el encabezado: siempre visible, con el total de unidades.
'use client';

import { ShoppingCart } from 'lucide-react';
import { useCarrito } from '@/lib/carrito';

export default function CartButton() {
  const { unidades, abrirCarrito } = useCarrito();

  return (
    <button
      type="button"
      onClick={abrirCarrito}
      aria-label={`Abrir pedido: ${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`}
      className="flex shrink-0 items-center gap-2.5 border-2 border-papel/30 py-1.5 pl-3 pr-1.5 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:border-seguridad"
    >
      <ShoppingCart className="h-5 w-5" strokeWidth={2.25} />
      <span className="hidden sm:inline">Pedido</span>
      <span
        className={`grid min-w-8 place-items-center px-1.5 py-0.5 tabular-nums ${
          unidades > 0 ? 'bg-seguridad text-tinta' : 'bg-papel/15 text-papel'
        }`}
      >
        {unidades}
      </span>
    </button>
  );
}
