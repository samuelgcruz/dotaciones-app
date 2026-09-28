// components/AccessoriesSelector.jsx
// Ahora cada accesorio es un botón completo (más fácil de tocar en celular),
// con miniatura de imagen y un check animado cuando está seleccionado.
'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';

export default function AccessoriesSelector({ accesorios, seleccionados, onToggle }) {
  if (!accesorios || accesorios.length === 0) {
    return <p className="text-sm text-gray-400">Esta área no tiene accesorios adicionales.</p>;
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
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
              <p className="text-sm font-medium">{accesorio.nombre}</p>
              <p className="text-sm text-gray-500">
                ${accesorio.precio.toLocaleString('es-CO')}
              </p>
            </div>

            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                activo ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
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
