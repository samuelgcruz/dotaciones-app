// components/ControlCantidad.jsx
// Control de cantidad para pedir por volumen: botones − / +, campo numérico que
// se puede escribir directo (por ejemplo 40) y atajos +5 / +10.
// `onCambiar` recibe siempre la cantidad final (ya limitada entre 0 y `max`).
'use client';

import { Minus, Plus } from 'lucide-react';

export default function ControlCantidad({ cantidad, max, onCambiar, etiqueta, rapidos = [5, 10] }) {
  const limitar = (n) => Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
  const botonLado =
    'grid w-11 shrink-0 place-items-center transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit';

  return (
    <div role="group" aria-label={`Cantidad: ${etiqueta}`} className="flex items-stretch gap-2">
      <div className="flex h-11 min-w-0 flex-1 items-stretch border-2 border-tinta bg-white">
        <button
          type="button"
          onClick={() => onCambiar(limitar(cantidad - 1))}
          disabled={cantidad <= 0}
          aria-label={`Quitar una unidad de ${etiqueta}`}
          className={botonLado}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>

        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={cantidad}
          aria-label={`Cantidad de ${etiqueta}`}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onCambiar(limitar(parseInt(e.target.value, 10)))}
          className="w-full min-w-0 bg-transparent text-center font-display text-2xl font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => onCambiar(limitar(cantidad + 1))}
          disabled={cantidad >= max}
          aria-label={`Agregar una unidad de ${etiqueta}`}
          className={botonLado}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>

      {rapidos.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onCambiar(limitar(cantidad + n))}
          disabled={cantidad >= max}
          aria-label={`Agregar ${n} unidades de ${etiqueta}`}
          className="h-11 shrink-0 border-2 border-tinta px-2.5 font-display text-lg font-semibold tabular-nums transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
        >
          +{n}
        </button>
      ))}
    </div>
  );
}
