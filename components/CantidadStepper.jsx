// components/CantidadStepper.jsx
// Control de cantidad compacto para las líneas del carrito: − / campo editable / +.
// El número se puede escribir directo (por ejemplo 59) sin pasar por los botones.
'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function CantidadStepper({
  cantidad,
  onMenos,
  onMas,
  onFijar, // opcional: recibe la cantidad escrita (0 elimina la línea)
  max = 99,
  puedeSumar = true,
  etiqueta,
  compacto = false,
}) {
  const [borrador, setBorrador] = useState(null);
  const alto = compacto ? 'h-9' : 'h-10';
  const boton =
    'grid w-10 shrink-0 place-items-center transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit';

  function alEscribir(e) {
    const texto = e.target.value.replace(/\D/g, '').slice(0, 3);
    if (texto === '') {
      setBorrador('');
      return;
    }
    const n = Math.min(parseInt(texto, 10), max);
    setBorrador(String(n));
    onFijar?.(n);
  }

  function alSalir() {
    if (borrador === '' && cantidad > 0) onFijar?.(cantidad); // campo vacío: se conserva lo que había
    setBorrador(null);
  }

  return (
    <div role="group" aria-label={`Cantidad: ${etiqueta}`} className={`flex ${alto} items-stretch border-2 border-tinta bg-papel`}>
      <button type="button" onClick={onMenos} aria-label={`Quitar una unidad de ${etiqueta}`} className={boton}>
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={`Cantidad de ${etiqueta}`}
        value={borrador ?? String(cantidad)}
        readOnly={!onFijar}
        onFocus={(e) => e.target.select()}
        onMouseUp={(e) => e.preventDefault()}
        onChange={alEscribir}
        onBlur={alSalir}
        className="w-full min-w-0 flex-1 border-x-2 border-tinta bg-transparent text-center font-display text-xl font-bold tabular-nums"
      />
      <button
        type="button"
        onClick={onMas}
        disabled={!puedeSumar}
        aria-label={`Agregar una unidad de ${etiqueta}`}
        className={boton}
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
