// components/CantidadStepper.jsx
// Control de cantidad reutilizable (tallas, accesorios y líneas del carrito).
//  - variante "caja": lleva borde propio.
//  - variante "embebido": se apoya en el borde del contenedor (celdas de talla).
//  - con `etiquetaAgregar`, cuando la cantidad es 0 se muestra un botón de texto.
'use client';

import { Minus, Plus } from 'lucide-react';

export default function CantidadStepper({
  cantidad,
  onMenos,
  onMas,
  puedeSumar = true,
  etiqueta,
  etiquetaAgregar,
  variante = 'caja',
  compacto = false,
}) {
  const alto = compacto ? 'h-9' : 'h-10';
  const botonBase =
    'grid w-10 shrink-0 place-items-center transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit';

  if (cantidad === 0 && etiquetaAgregar) {
    return (
      <button
        type="button"
        onClick={onMas}
        disabled={!puedeSumar}
        className={`${alto} w-full border-2 border-tinta bg-tinta px-4 font-display text-lg font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-seguridad hover:text-tinta disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-tinta disabled:hover:text-papel`}
      >
        {etiquetaAgregar}
      </button>
    );
  }

  const contorno = variante === 'caja' ? 'border-2 border-tinta bg-papel' : 'border-t-2 border-inherit';

  return (
    <div role="group" aria-label={`Cantidad: ${etiqueta}`} className={`flex ${alto} items-stretch ${contorno}`}>
      <button
        type="button"
        onClick={onMenos}
        disabled={cantidad === 0}
        aria-label={`Quitar una unidad de ${etiqueta}`}
        className={botonBase}
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span
        aria-live="polite"
        className="grid min-w-9 flex-1 place-items-center font-display text-xl font-bold tabular-nums"
      >
        {cantidad}
      </span>
      <button
        type="button"
        onClick={onMas}
        disabled={!puedeSumar}
        aria-label={`Agregar una unidad de ${etiqueta}`}
        className={botonBase}
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
