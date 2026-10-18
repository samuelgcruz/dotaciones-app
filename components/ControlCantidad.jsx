// components/ControlCantidad.jsx
// Control de cantidad para pedir por volumen. Se puede:
//   - escribir el número exacto en el campo (por ejemplo 59),
//   - sumar o restar de a 1,
//   - sumar o restar de a 5 y de a 10,
//   - quitar todo de un clic.
// `onCambiar` recibe siempre la cantidad final, ya limitada entre 0 y `max`.
'use client';

import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function ControlCantidad({ cantidad, max, onCambiar, etiqueta }) {
  const idCampo = useId();
  // Mientras se escribe se conserva el texto tal cual (permite borrar y teclear de nuevo)
  const [borrador, setBorrador] = useState(null);

  const limitar = (n) => Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
  const cambiar = (n) => {
    setBorrador(null);
    onCambiar(limitar(n));
  };

  function alEscribir(e) {
    const texto = e.target.value.replace(/\D/g, '').slice(0, 5);
    if (texto === '') {
      setBorrador('');
      return;
    }
    const n = parseInt(texto, 10);
    if (n === 0) {
      setBorrador(''); // el campo vuelve a quedar vacío para poder escribir el número correcto
      onCambiar(0);
      return;
    }
    if (n > max) {
      setBorrador(String(max)); // no deja escribir más del máximo disponible
      onCambiar(max);
      return;
    }
    setBorrador(texto);
    onCambiar(n);
  }

  function alSalir() {
    if (borrador === '') onCambiar(0);
    setBorrador(null);
  }

  const lado =
    'grid w-12 shrink-0 place-items-center transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit';
  const salto =
    'h-9 border-2 border-tinta bg-white font-display text-lg font-semibold tabular-nums transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit';

  return (
    <div role="group" aria-label={`Cantidad: ${etiqueta}`} className="space-y-2">
      <div>
        <label htmlFor={idCampo} className="mb-1 block text-xs font-semibold text-acero">
          Cantidad (puedes escribirla)
        </label>
        <div className="flex h-12 items-stretch border-2 border-tinta bg-white">
          <button
            type="button"
            onClick={() => cambiar(cantidad - 1)}
            disabled={cantidad <= 0}
            aria-label={`Quitar una unidad de ${etiqueta}`}
            className={lado}
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
          <input
            id={idCampo}
            aria-label={`Cantidad de ${etiqueta}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={borrador ?? (cantidad === 0 ? '' : String(cantidad))}
            onFocus={(e) => e.target.select()}
            onMouseUp={(e) => e.preventDefault()}
            onChange={alEscribir}
            onBlur={alSalir}
            className="w-full min-w-0 border-x-2 border-tinta bg-transparent text-center font-display text-3xl font-bold tabular-nums"
          />
          <button
            type="button"
            onClick={() => cambiar(cantidad + 1)}
            disabled={cantidad >= max}
            aria-label={`Agregar una unidad de ${etiqueta}`}
            className={lado}
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={() => cambiar(cantidad - 10)} disabled={cantidad <= 0} aria-label={`Quitar 10 unidades de ${etiqueta}`} className={salto}>
          −10
        </button>
        <button type="button" onClick={() => cambiar(cantidad - 5)} disabled={cantidad <= 0} aria-label={`Quitar 5 unidades de ${etiqueta}`} className={salto}>
          −5
        </button>
        <button type="button" onClick={() => cambiar(cantidad + 5)} disabled={cantidad >= max} aria-label={`Agregar 5 unidades de ${etiqueta}`} className={salto}>
          +5
        </button>
        <button type="button" onClick={() => cambiar(cantidad + 10)} disabled={cantidad >= max} aria-label={`Agregar 10 unidades de ${etiqueta}`} className={salto}>
          +10
        </button>
      </div>

      {cantidad > 0 && (
        <button
          type="button"
          onClick={() => cambiar(0)}
          className="text-sm font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel"
        >
          Quitar todas
        </button>
      )}
    </div>
  );
}
