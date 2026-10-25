// components/BotonGuiaTallas.jsx
// Botón "Guía de tallas" para las fichas de prenda: abre la guía en una ventana encima del
// catálogo, sin salir de la página, así el pedido y las cantidades se mantienen.
'use client';

import { useEffect, useRef, useState } from 'react';
import { Ruler, X } from 'lucide-react';
import GuiaTallas from './GuiaTallas';

export default function BotonGuiaTallas({ genero = 'mujer' }) {
  const [abierta, setAbierta] = useState(false);
  const ventana = useRef(null);

  useEffect(() => {
    if (abierta && ventana.current && !ventana.current.open) ventana.current.showModal();
  }, [abierta]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel"
      >
        <Ruler className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        Guía de tallas
      </button>

      {abierta && (
        <dialog
          ref={ventana}
          aria-label="Guía de tallas"
          onClose={() => setAbierta(false)}
          onClick={(e) => {
            if (e.target === ventana.current) ventana.current.close();
          }}
          className="m-auto max-h-[92vh] w-[min(56rem,calc(100vw-1rem))] overflow-y-auto border-2 border-tinta bg-papel p-0 text-tinta backdrop:bg-tinta/70"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-tinta bg-grafito px-4 py-3 text-papel">
            <h2 className="font-display text-3xl font-bold uppercase leading-none">Guía de tallas</h2>
            <button
              type="button"
              onClick={() => ventana.current?.close()}
              aria-label="Cerrar la guía de tallas"
              className="grid h-10 w-10 place-items-center border-2 border-papel hover:bg-seguridad hover:text-tinta"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <GuiaTallas generoInicial={genero} enVentana />
          </div>
        </dialog>
      )}
    </>
  );
}
