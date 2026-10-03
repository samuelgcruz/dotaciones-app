// components/AccessoriesSelector.jsx
// Cada accesorio es un botón completo (más fácil de tocar en celular), con
// miniatura de imagen y un check animado cuando está seleccionado.
'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';

export default function AccessoriesSelector({ accesorios, seleccionados, onToggle }) {
  if (!accesorios || accesorios.length === 0) {
    return <p className="text-sm text-slate-400">Esta área no tiene accesorios adicionales.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {accesorios.map((accesorio) => {
        const activo = Boolean(seleccionados[accesorio.id]);
        return (
          <button
            type="button"
            key={accesorio.id}
            onClick={() => onToggle(accesorio)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 ${
              activo
                ? 'border-amber-500 bg-amber-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
            }`}
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {accesorio.imagen_url && (
                <Image
                  src={accesorio.imagen_url}
                  alt={accesorio.nombre}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{accesorio.nombre}</p>
              <p className="text-sm text-slate-500">
                ${accesorio.precio.toLocaleString('es-CO')}
              </p>
            </div>

            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                activo ? 'border-amber-600 bg-amber-600' : 'border-slate-300 bg-white'
              }`}
            >
              {activo && <Check className="h-4 w-4 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
